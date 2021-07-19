import type { DB } from '../db';
import type { DBLevel, DBOp } from '../db/types';
import type { VaultId, Vaults } from './types';
import type { KeyManager } from '../keys';

import path from 'path';
import fs from 'fs';
import { Mutex } from 'async-mutex';
import Logger from '@matrixai/logger';

import { Vault } from './';

import * as vaultErrors from './errors';
import { errors as dbErrors } from '../db';

class VaultMap {
  public readonly vaultMapPath: string;

  protected logger: Logger;
  protected db: DB;
  protected keyManager: KeyManager;
  protected mapDbDomain: string = this.constructor.name;
  protected mapVaultsDbDomain: Array<string> = [this.mapDbDomain, 'vaults'];
  protected mapNamesDbDomain: Array<string> = [this.mapDbDomain, 'names'];
  protected mapLinksDbDomain: Array<string> = [this.mapDbDomain, 'links'];
  protected vaultMapDb: DBLevel<string>;
  protected mapVaultsDb: DBLevel<VaultId>;
  protected mapNamesDb: DBLevel<string>;
  protected mapLinksDb: DBLevel<VaultId>;
  protected lock: Mutex = new Mutex();

  protected _started: boolean = false;

  constructor({
    db,
    vaultMapPath,
    logger,
  }: {
    db: DB;
    vaultMapPath: string;
    logger?: Logger;
  }) {
    this.logger = logger ?? new Logger(this.constructor.name);
    this.db = db;
    this.vaultMapPath = vaultMapPath;
  }

  get started(): boolean {
    return this._started;
  }

  get locked(): boolean {
    return this.lock.isLocked();
  }

  public async start({
    fresh = false,
  }: {
    fresh?: boolean;
  } = {}): Promise<void> {
    try {
      if (this._started) {
        return;
      }
      this.logger.info('Starting Vault Map');
      this._started = true;
      if (!this.db.started) {
        throw new dbErrors.ErrorDBNotStarted();
      }
      const mapDb = await this.db.level<string>(this.mapDbDomain);

      // vaults stores VaultId -> VaultKey
      const mapVaultsDb = await this.db.level<VaultId>(
        this.mapVaultsDbDomain[1],
        mapDb,
      );

      // names stores VaultName -> VaultId
      const mapNamesDb = await this.db.level<string>(
        this.mapNamesDbDomain[1],
        mapDb,
      );

      // links stores VaultId -> VaultLink
      const mapLinksDb = await this.db.level<VaultId>(
        this.mapLinksDbDomain[1],
        mapDb,
      );

      if (fresh) {
        await mapDb.clear();
      }

      this.vaultMapDb = mapDb;
      this.mapVaultsDb = mapVaultsDb;
      this.mapNamesDb = mapNamesDb;
      this.mapLinksDb = mapLinksDb;
      this.logger.info('Started Vault Map');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  async stop() {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping Vault Map');
    this._started = false;
    this.logger.info('Stopped Vault Map');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
  public async transaction<T>(
    f: (vaultMap: VaultMap) => Promise<T>,
  ): Promise<T> {
    const release = await this.lock.acquire();
    try {
      return await f(this);
    } finally {
      release();
    }
  }

  /**
   * Transaction wrapper that will not lock if the operation was executed
   * within a transaction context
   */
  public async _transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this.lock.isLocked()) {
      return await f();
    } else {
      return await this.transaction(f);
    }
  }

  /**
   * Gets the vault id for a given vault name
   */
  public async getVaultIdByVaultName(
    vaultName: string,
  ): Promise<VaultId | undefined> {
    return await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.mapNamesDbDomain,
        vaultName,
      );
      if (vaultId == null) {
        return;
      }
      return vaultId.replace(/"/g, '') as VaultId;
    });
  }

  /**
   * Gets the vault lin for a given vault id
   */
  public async getVaultLinkByVaultId(
    vaultId: VaultId,
  ): Promise<string | undefined> {
    return await this._transaction(async () => {
      const vaultLink = await this.db.get<string>(
        this.mapLinksDbDomain,
        vaultId,
      );
      if (vaultLink == null) {
        return;
      }
      return vaultLink.replace(/"/g, '');
    });
  }

  /**
   * Renames an existing vault name to a new vault name
   * If the existing vault name doesn't exist, nothing will change
   */
  public async renameVault(
    vaultName: string,
    newVaultName: string,
  ): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.mapNamesDbDomain,
        vaultName,
      );
      if (!vaultId) {
        return;
      }
      const ops: Array<DBOp> = [
        {
          type: 'del',
          domain: this.mapNamesDbDomain,
          key: vaultName,
        },
        {
          type: 'put',
          domain: this.mapNamesDbDomain,
          key: newVaultName,
          value: vaultId,
        },
      ];
      await this.db.batch(ops);
    });
  }

  /**
   * Puts a new vault and the vault Id into the db
   */
  public async setVault(
    vaultName: string,
    vaultId: VaultId,
    vaultKey: Buffer,
  ): Promise<void> {
    await this._transaction(async () => {
      const existingId = await this.db.get<VaultId>(
        this.mapNamesDbDomain,
        vaultName,
      );
      if (existingId) {
        throw new vaultErrors.ErrorVaultDefined(
          'Vault Name already exists in Polykey, specify a new Vault Name',
        );
      }
      const ops: Array<DBOp> = [
        {
          type: 'put',
          domain: this.mapNamesDbDomain,
          key: vaultName,
          value: vaultId,
        },
        {
          type: 'put',
          domain: this.mapVaultsDbDomain,
          key: vaultId,
          value: vaultKey,
        },
      ];
      await this.db.batch(ops);
    });
  }

  /**
   * Puts a new vault and the vault Id into the db
   */
  public async setVaultLink(
    vaultId: VaultId,
    vaultLink: string,
  ): Promise<void> {
    await this._transaction(async () => {
      await this.db.put(this.mapLinksDbDomain, vaultId, vaultLink);
    });
  }

  /**
   * Deletes a vault using an existing vault name
   * If the existing vault name doesn't exist, nothing will change
   */
  public async delVault(vaultName: string): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.mapNamesDbDomain,
        vaultName,
      );
      if (vaultId == null) {
        return;
      }
      const ops: Array<DBOp> = [
        {
          type: 'del',
          domain: this.mapNamesDbDomain,
          key: vaultName,
        },
        {
          type: 'del',
          domain: this.mapVaultsDbDomain,
          key: vaultId,
        },
        {
          type: 'del',
          domain: this.mapLinksDbDomain,
          key: vaultId,
        },
      ];
      await this.db.batch(ops);
    });
  }

  /**
   * Load existing vaults data into memory from vault metadata path.
   * If metadata does not exist, does nothing.
   */
  public async loadVaultData(): Promise<Vaults> {
    return await this._transaction(async () => {
      const names = {};
      const vaults: Vaults = {};

      for await (const o of this.mapNamesDb.createReadStream({})) {
        const id = (o as any).value;
        const name = (o as any).key as string;
        const vaultId = this.db.unserializeDecrypt<VaultId>(id) as string;
        names[vaultId] = name;
      }
      for await (const o of this.mapVaultsDb.createReadStream({})) {
        const id = (o as any).key;
        const key = (o as any).value;
        const vaultKey = this.db.unserializeDecrypt<Buffer>(key);
        const name = names[id];
        const link = await this.getVaultLinkByVaultId(id as VaultId);

        vaults[id] = {
          vault: new Vault({
            vaultId: id,
            vaultName: name,
            baseDir: path.join(this.vaultMapPath, id),
            fs: fs,
            logger: this.logger,
          }),
          vaultName: name,
          vaultKey: Buffer.from(vaultKey),
          vaultLink: link,
        };
      }
      return vaults;
    });
  }
}

export default VaultMap;
