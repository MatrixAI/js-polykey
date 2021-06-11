import type { AbstractBatch, AbstractLevelDOWN, AbstractIterator } from 'abstract-leveldown';
import type { LevelDB } from 'level';
import type { LevelUp } from 'levelup';
import type { ACLOp } from './types';
import type { VaultId } from './types';
import type { Vault } from './';
import type { KeyManager } from '../keys';
import type { FileSystem } from '../types';

import path from 'path';
import level from 'level';
import subleveldown from 'subleveldown';
import sublevelprefixer from 'sublevel-prefixer';
import { Mutex } from 'async-mutex';
import Logger from '@matrixai/logger';
import * as aclUtils from './utils';
import * as aclErrors from './errors';
import { utils as keysUtils, errors as keysErrors } from '../keys';
import * as utils from '../utils';

class ACL {
  public readonly aclVaultPath: string;
  public readonly aclVaultDbPath: string;

  protected logger: Logger;
  protected fs: FileSystem;
  protected keyManager: KeyManager;
  protected aclVaultDb: LevelDB<string, Buffer>;
  protected aclVaultDbKey: Buffer;
  protected aclVaultDbPrefixer: (domain: string, key: string) => string;
  protected aclVaultsDb: LevelUp<
    AbstractLevelDOWN<VaultId, Buffer>,
    AbstractIterator<VaultId, Buffer>
  >;
  protected aclNamesDb: LevelUp<
    AbstractLevelDOWN<string, Buffer>,
    AbstractIterator<string, Buffer>
  >;
  protected aclDbMutex: Mutex = new Mutex();

  protected _transacting: boolean = false;
  protected _started: boolean = false;

  constructor({
    aclVaultPath,
    keyManager,
    fs,
    logger,
  }: {
    aclVaultPath: string;
    keyManager: KeyManager;
    fs?: FileSystem;
    logger?: Logger;
  }) {
    this.logger = logger ?? new Logger(this.constructor.name);
    this.fs = fs ?? require('fs');
    this.aclVaultPath = aclVaultPath;
    this.keyManager = keyManager;
    this.aclVaultDbPath = path.join(aclVaultPath, 'trust_db');
  }

  get started(): boolean {
    return this._started;
  }

  get transacting(): boolean {
    return this._transacting;
  }

  public async start ({
    bits = 256,
    fresh  = false
  }: {
    bits?: number;
    fresh?: boolean;
  } = {}): Promise<void> {
    try {
      if (this._started) {
        return;
      }
      this.logger.info('Starting ACL');
      this._started = true;
      if (!this.keyManager.started) {
        throw new keysErrors.ErrorKeyManagerNotStarted();
      }
      this.logger.info(`Setting ACL path to ${this.aclVaultPath}`);
      if (fresh) {
        await this.fs.promises.rm(this.aclVaultPath, {
          force: true,
          recursive: true,
        });
      }
      await utils.mkdirExists(
        this.fs,
        this.aclVaultPath,
        { recursive: true }
      );
      const aclDb = await level(this.aclVaultDbPath, { valueEncoding: 'binary' });
      const aclDbKey = await this.setupAclDbKey(bits);
      const aclDbPrefixer = sublevelprefixer('!');
      // vaults stores VaultId -> Vault
      const aclVaultsDb = subleveldown<VaultId, Buffer>(
        aclDb,
        'vaults',
        { valueEncoding: 'binary' }
      );
      // names stores VaultName -> VaultId
      const aclNamesDb = subleveldown<string, Buffer>(
        aclDb,
        'names',
        { valueEncoding: 'binary' }
      );
      this.aclVaultDb = aclDb;
      this.aclVaultDbKey = aclDbKey;
      this.aclVaultDbPrefixer = aclDbPrefixer;
      this.aclVaultsDb = aclVaultsDb;
      this.aclNamesDb = aclNamesDb;
      this.logger.info('Started ACL');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  async stop () {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping ACL');
    this._started = false;
    await this.aclVaultDb.close();
    this.logger.info('Stopped ACL');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
  public async transaction<T>(f: (acl: ACL) => Promise<T>): Promise<T> {
    const release = await this.aclDbMutex.acquire();
    this._transacting = true;
    try {
      return await f(this);
    } finally {
      this._transacting = false;
      release();
    }
  }

  /**
   * Transaction wrapper that will not lock if the operation was executed
   * within a transaction context
   */
  protected async _transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this._transacting) {
      return await f();
    } else {
      const release = await this.aclDbMutex.acquire();
      try {
        return await f();
      } finally {
        release();
      }
    }
  }

  /**
   * Gets the vault for a given vault name
   */
  public async getVaultByVaultName(vaultName: string): Promise<Vault | undefined> {
    return await this._transaction(async () => {
      const vaultId = await this.getAclDb('names', vaultName);
      if (vaultId == null) {
        return;
      }
      const vault = await this.getAclDb('vaults', vaultId) as Vault;
      return vault;
    });
  }

  /**
   * Gets the vault for a given vault id
   */
  public async getVaultByVaultId(vaultId: VaultId): Promise<Vault | undefined> {
    return await this._transaction(async () => {
      const vault = await this.getAclDb('vaults', vaultId);
      if (vault == null) {
        return;
      }
      return vault;
    });
  }

  /**
   * Gets the vault id for a given vault name
   */
  public async getVaultIdByVaultName(vaultName: string): Promise<VaultId | undefined> {
    return await this._transaction(async () => {
      const vaultId = await this.getAclDb('names', vaultName);
      if (vaultId == null) {
        return;
      }
      return vaultId;
    });
  }

  /**
   * Sets the new vault name using an existing vault name
   * If the existing vault name doesn't exist, nothing will change
   */
  public async setVaultNameByVaultId(vaultName: string, newVaultName: string): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.getAclDb('names', vaultName);
      if (!vaultId) {
        return;
      }
      await this.delVaultAclDb('names', vaultName);
      await this.putVaultAclDb('names', newVaultName, vaultId);
    });
  }

  /**
   * Deletes a vault using an existing vault name
   * If the existing vault name doesn't exist, nothing will change
   */
  public async delVault(vaultName: string): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.getAclDb('names', vaultName);
      if (vaultId == null) {
        return;
      }
      const ops: Array<ACLOp> = [];
      ops.push({
        type: 'del',
        domain: 'vaults',
        key: vaultId
      });
      ops.push({
        type: 'del',
        domain: 'names',
        key: vaultName
      });
      await this.batchAclDb(ops);
    });
  }

  protected async setupAclDbKey(bits: number = 256): Promise<Buffer> {
    let trustDbKey = await this.keyManager.getKey(this.constructor.name);
    if (trustDbKey != null) {
      return trustDbKey;
    }
    this.logger.info('Generating ACL db key');
    trustDbKey = await keysUtils.generateKey(bits);
    await this.keyManager.putKey(this.constructor.name, trustDbKey);
    return trustDbKey;
  }

  protected async getAclDb(
    domain: 'vaults',
    key: VaultId
  ): Promise<Vault | undefined>;
  protected async getAclDb(
    domain: 'names',
    key: string
  ): Promise<VaultId | undefined>;
  protected async getAclDb(domain: any, key: any): Promise<any> {
    if (!this._started) {
      throw new aclErrors.ErrorACLNotStarted();
    }
    let data: Buffer;
    try {
      data = await this.aclVaultDb.get(
        this.aclVaultDbPrefixer(domain, key)
      );
    } catch (e) {
      if (e.notFound) {
        return undefined;
      }
      throw e;
    }
    return aclUtils.unserializeDecrypt(
      this.aclVaultDbKey,
      data
    );
  }

  protected async putVaultAclDb(
    domain: 'vaults',
    key: VaultId,
    value: Vault
  ): Promise<void>;
  protected async putVaultAclDb(
    domain: 'names',
    key: string,
    value: VaultId
  ): Promise<void>;
  protected async putVaultAclDb(domain: any, key: any, value: any): Promise<void> {
    if (!this._started) {
      throw new aclErrors.ErrorACLNotStarted();
    }
    const data = aclUtils.serializeEncrypt(
      this.aclVaultDbKey,
      value
    );
    await this.aclVaultDb.put(this.aclVaultDbPrefixer(domain, key), data);
  }

  protected async delVaultAclDb(
    domain: 'vaults',
    key: VaultId
  ): Promise<void>;
  protected async delVaultAclDb(
    domain: 'names',
    key: string
  ): Promise<void>;
  protected async delVaultAclDb(domain: any, key: any): Promise<void> {
    if (!this._started) {
      throw new aclErrors.ErrorACLNotStarted();
    }
    await this.aclVaultDb.del(this.aclVaultDbPrefixer(domain, key));
  }

  protected async batchAclDb(ops: Array<ACLOp>): Promise<void> {
    if (!this._started) {
      throw new aclErrors.ErrorACLNotStarted();
    }
    const ops_: Array<AbstractBatch> = [];
    for (const op of ops) {
      if (op.type === 'del') {
        ops_.push({
          type: op.type,
          key: this.aclVaultDbPrefixer(op.domain, op.key)
        });
      } else if (op.type === 'put') {
        const data = aclUtils.serializeEncrypt(
          this.aclVaultDbKey,
          op.value,
        );
        ops_.push({
          type: op.type,
          key: this.aclVaultDbPrefixer(op.domain, op.key),
          value: data,
        });
      }
    }
    await this.aclVaultDb.batch(ops_);
  }

}

export default ACL;
