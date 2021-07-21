import type { DB } from '../db';
import type { DBLevel, DBOp } from '../db/types';
import type { VaultId, Vaults, VaultAction } from './types';
import type { FileSystem } from '../types';
import type { WorkerManager } from '../workers';
import type { NodeId } from '../nodes/types';

import fs from 'fs';
import path from 'path';
import Logger from '@matrixai/logger';
import { Mutex } from 'async-mutex';
import git from 'isomorphic-git';
import Vault from './Vault';

import { KeyManager } from '../keys';
import { NodeManager } from '../nodes';
import { GestaltGraph } from '../gestalts';
import { ACL } from '../acl';
import { GitRequest } from '../git';
import { agentPB } from '../agent';

import * as utils from '../utils';
import { utils as vaultUtils }from './';
import { errors as vaultErrors } from './';
import * as keysErrors from '../keys/errors';
import * as gitErrors from '../git/errors';
import * as nodesErrors from '../nodes/errors';
import { errors as aclErrors } from '../acl';
import { errors as gestaltErrors } from '../gestalts';
import { errors as dbErrors } from '../db';

class VaultManager {
  public readonly vaultsPath: string;
  public readonly vaultsDbPath: string;

  protected fs: FileSystem;

  protected keyManager: KeyManager;
  protected nodeManager: NodeManager;
  protected db: DB;
  protected acl: ACL;
  protected gestaltGraph: GestaltGraph;

  protected vaultsDbDomain: string = this.constructor.name;
  protected vaultsKeysDbDomain: Array<string> = [this.vaultsDbDomain, 'keys'];
  protected vaultsNamesDbDomain: Array<string> = [this.vaultsDbDomain, 'names'];
  protected vaultsNodesDbDomain: Array<string> = [this.vaultsDbDomain, 'nodes'];
  protected vaultsDb: DBLevel<string>;
  protected vaultsKeysDb: DBLevel<VaultId>;
  protected vaultsNamesDb: DBLevel<string>;
  protected vaultsNodesDb: DBLevel<VaultId>;
  protected lock: Mutex = new Mutex();

  protected vaults: Vaults;
  protected logger: Logger;
  protected workerManager?: WorkerManager;

  protected _started: boolean;

  /**
   * Construct a VaultManager object
   * @param vaultsPath path to store vault and vault data in. should be <polykey_folder>/vaults
   * @param keyManager Key Manager object
   * @param fs fs object
   * @param logger Logger
   */
  constructor({
    vaultsPath,
    keyManager,
    nodeManager,
    db,
    acl,
    gestaltGraph,
    fs,
    logger,
  }: {
    vaultsPath: string;
    keyManager: KeyManager;
    nodeManager: NodeManager;
    db: DB;
    acl: ACL;
    gestaltGraph: GestaltGraph;
    fs?: FileSystem;
    logger?: Logger;
  }) {
    this.vaultsPath = vaultsPath;
    this.vaultsDbPath = path.join(this.vaultsPath, 'vaultsDb');

    this.keyManager = keyManager;
    this.db = db;
    this.nodeManager = nodeManager;
    this.acl = acl;
    this.gestaltGraph = gestaltGraph;

    this.fs = fs ?? require('fs');

    this.vaults = {};
    this.logger = logger ?? new Logger(this.constructor.name);
    this._started = false;
  }

  // TODO: Add in node manager started in here
  get started(): boolean {
    if (
      this._started &&
      this.keyManager.started &&
      this.db.started &&
      this.acl.started &&
      this.gestaltGraph.started
    ) {
      return true;
    }
    return false;
  }

  get locked(): boolean {
    return this.lock.isLocked();
  }

  public setWorkerManager(workerManager: WorkerManager) {
    this.workerManager = workerManager;
    for (const vaultId in this.vaults) {
      this.vaults[vaultId].setWorkerManager(workerManager);
    }
  }

  public unsetWorkerManager() {
    delete this.workerManager;
    for (const vaultId in this.vaults) {
      this.vaults[vaultId].unsetWorkerManager();
    }
  }

  public async start({ fresh = false }: { fresh?: boolean }) {
    if (!this.keyManager.started ) {
      throw new keysErrors.ErrorKeyManagerNotStarted();
    } else if (!this.db.started) {
      throw new dbErrors.ErrorDBNotStarted();
    } else if (!(await this.nodeManager.started())) {
      throw new nodesErrors.ErrorNodeManagerNotStarted();
    } else if (!this.acl.started) {
      throw new aclErrors.ErrorACLNotStarted();
    } else if (!this.gestaltGraph.started) {
      throw new gestaltErrors.ErrorGestaltsGraphNotStarted();
    }
    if (fresh) {
      await this.fs.promises.rm(this.vaultsPath, {
        force: true,
        recursive: true,
      });
    }
    await utils.mkdirExists(this.fs, this.vaultsPath, { recursive: true });
    this.vaultsDb = await this.db.level<string>(this.vaultsDbDomain);
    // Stores VaultId -> VaultKey
    this.vaultsKeysDb = await this.db.level<VaultId>(
      this.vaultsKeysDbDomain[1],
      this.vaultsDb,
    );
    // Stores VaultName -> VaultId
    this.vaultsNamesDb = await this.db.level<string>(
      this.vaultsNamesDbDomain[1],
      this.vaultsDb,
    );
    // Stores VaultId -> NodeId
    this.vaultsNodesDb = await this.db.level<VaultId>(
      this.vaultsNodesDbDomain[1],
      this.vaultsDb,
    );
    if (fresh) {
      await this.vaultsDb.clear();
    }
    // await this.loadVaultData();
    this._started = true;
  }

  public async stop() {
    this.logger.info('Stopping Vault Manager');
    this._started = false;
    this.logger.info('Stopped Vault Manager');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
   public async transaction<T>(
    f: (vaultManager: VaultManager) => Promise<T>,
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
   * Adds a new vault, given a vault name. Also generates a new vault key
   * and writes encrypted vault metadata to disk.
   *
   * @throws ErrorVaultDefined if vault with the same name already exists
   * @param vaultName Name of the new vault
   * @returns The newly created vault object
   */
  public async createVault(vaultName: string): Promise<Vault> {
    // Generate a unique vault Id
    const vaultId = await this.generateVaultId();

    // Create the Vault instance and path
    await this.fs.promises.mkdir(path.join(this.vaultsPath, vaultId));
    const vault = new Vault({
      vaultId: vaultId,
      vaultName: vaultName,
      baseDir: path.join(this.vaultsPath, vaultId),
      fs: fs,
      logger: this.logger,
    });

    // Generate the key and store the vault in memory and on disk
    const key = await vaultUtils.generateVaultKey();
    await this.createVaultOps(vaultName, vaultId as VaultId, key);
    await vault.start({ key: key });
    this.vaults[vaultId] = vault;
    return vault;
  }

  /**
   * Retreieves the Vault instance
   *
   * @throws ErrorVaultUndefined if vaultId does not exist
   * @param vaultId Id of vault
   * @returns a vault instance.
   */
  public async getVault(vaultId: string): Promise<Vault> {
    if (!this.vaults[vaultId]) {
      await this.setupVault(vaultId);
    }
    return this.vaults[vaultId];
  }

  /**
   * Rename an existing vault. Updates references to vault keys and
   * writes new encrypted vault metadata to disk.
   *
   * @throws ErrorVaultUndefined if vault currVaultName does not exist
   * @throws ErrorVaultDefined if newVaultName already exists
   * @param vaultId Id of vault to be renamed
   * @param newVaultName New name of  vault
   * @returns true if success
   */
  public async renameVault(
    vaultId: string,
    newVaultName: string,
  ): Promise<boolean> {
    if (!this.vaults[vaultId]) {
      await this.setupVault(vaultId);
    }
    const vault = this.vaults[vaultId];
    await this.renameVaultOps(vault.vaultName, newVaultName);
    await vault.renameVault(newVaultName);
    return true;
  }

  /**
   * Retreives stats for a vault
   *
   * @returns the stats of the vault directory
   */
  public async vaultStats(vaultId: string): Promise<fs.Stats> {
    if (!this.vaults[vaultId]) {
      await this.setupVault(vaultId);
    }
    const vault = this.vaults[vaultId];
    return await vault.stats();
  }

  /**
   * Delete an existing vault. Deletes file from filesystem and
   * updates mappings to vaults and vaultKeys. If it fails to delete
   * from the filesystem, it will not modify any mappings and reutrn false
   *
   * @throws ErrorVaultUndefined if vault name does not exist
   * @param vaultId Id of vault to be deleted
   * @returns true if successful delete, false if vault path still exists
   */
  public async deleteVault(vaultId: string): Promise<boolean> {
    return await this._transaction(async () => {
      return await this.acl._transaction(async () => {
        if (!this.vaults[vaultId]) {
          await this.setupVault(vaultId);
        }
        await this.vaults[vaultId].stop();
        const vaultPath = this.vaults[vaultId].baseDir;
        this.logger.info(`Removed vault directory at '${vaultPath}'`);
        if (await vaultUtils.fileExists(this.fs, vaultPath)) {
          return false;
        }
        const name = this.vaults[vaultId].vaultName;
        await this.deleteVaultOps(name);
        await this.acl.unsetVaultPerms(vaultId as VaultId);
        delete this.vaults[vaultId];
        return true;
      });
    });
  }

  /**
   * Retrieve all the vaults for current node
   *
   * @returns Array of VaultName and VaultIds managed currently by the vault manager
   */
  public async listVaults(): Promise<Array<{ name: string; id: string }>> {
    const vaults: Array<{ name: string; id: string }> = [];
    for await (const o of this.vaultsNamesDb.createReadStream({})) {
      const id = (o as any).value;
      const name = (o as any).key as string;
      const vaultId = this.db.unserializeDecrypt<VaultId>(id) as string;
      vaults.push({
        name: name,
        id: vaultId,
      });
    }
    return vaults;
  }

  /**
   * Gives vault id given the vault name
   * @param vaultName The Vault name
   * @returns the id that matches the given vault name. undefined if nothing is found
   */
  public async getVaultId(vaultName: string): Promise<string | undefined> {
    return await this.getVaultIdByVaultName(vaultName);
  }

  /**
   * Scans all the vaults for current node which a node Id has permissions for
   *
   * @returns Array of VaultName and VaultIds managed currently by the vault manager
   */
  public async scanVaults(
    nodeId: string,
  ): Promise<Array<{ name: string; id: string }>> {
    return await this.acl._transaction(async () => {
      const vaults = await this.listVaults();
      const scan: Array<{ name: string; id: string }> = [];
      for (const vault of vaults) {
        const list = await this.acl.getVaultPerm(vault.id as VaultId);
        if (list[nodeId]) {
          if (list[nodeId].vaults[vault.id]['pull'] !== undefined) {
            scan.push(vault);
          }
        }
      }
      return scan;
    });
  }

  /**
   * Sets the default pull node of a vault
   *
   * @throws ErrorVaultUndefined if vaultId does not exist
   * @param vaultId Id of vault
   * @param linkVault Id of the cloned vault
   */
  public async setDefaultNode(vaultId: string, nodeId: string): Promise<void> {
    if (!this.vaults[vaultId]) {
      await this.setupVault(vaultId);
    }
    await this.setVaultNodebyVaultId(vaultId as VaultId, nodeId);
  }

  /**
   * Gets the Vault that is associated with a cloned Vault ID
   *
   * @throws ErrorVaultUndefined if vaultId does not exist
   * @param vaultId Id of vault that has been cloned
   * @returns instance of the vault that is linked to the cloned vault
   */
  public async getDefaultNode(vaultId: string): Promise<string | undefined> {
    return await this.getVaultNodeByVaultId(vaultId as VaultId);
  }

  /**
   * Sets the permissions of a gestalt using a provided nodeId
   * This should take in a nodeId representing a gestalt, and remove
   * all permissions for all nodeIds that are associated in the gestalt graph
   *
   * @param nodeId Identifier for gestalt as NodeId
   * @param vaultId Id of the vault to set permissions for
   */
  public async setVaultPermissions(nodeId: string, vaultId: string): Promise<void> {
    return await this.gestaltGraph._transaction(async () => {
      return await this.acl._transaction(async () => {
        const gestalt = await this.gestaltGraph.getGestaltByNode(
          nodeId as NodeId,
        );
        if (!gestalt) {
          throw new gestaltErrors.ErrorGestaltsGraphNodeIdMissing();
        }
        const nodes = gestalt?.nodes;
        for (const node in nodes) {
          await this.setVaultAction([nodes[node].id], vaultId as VaultId);
        }
      });
    });
  }

  /**
   * Unsets the permissions of a gestalt using a provided nodeId
   * This should take in a nodeId representing a gestalt, and remove
   * all permissions for all nodeIds that are associated in the gestalt graph
   *
   * @param nodeId Identifier for gestalt as NodeId
   * @param vaultId Id of the vault to unset permissions for
   */
  public async unsetVaultPermissions(nodeId: string, vaultId: string): Promise<void> {
    return await this.gestaltGraph._transaction(async () => {
      return await this.acl._transaction(async () => {
        const gestalt = await this.gestaltGraph.getGestaltByNode(
          nodeId as NodeId,
        );
        if (!gestalt) {
          return;
        }
        const nodes = gestalt?.nodes;
        for (const node in nodes) {
          await this.unsetVaultAction([nodes[node].id], vaultId as VaultId);
        }
      });
    });
  }

  /**
   * Gets the permissions of a vault for a single or all nodes
   *
   * @param nodeId Id of the specific node to look up permissions for
   * @param vaultId Id of the vault to look up permissions for
   * @returns a record of the permissions for the vault
   */
  public async getVaultPermissions(
    vaultId: string,
    nodeId?: string,
  ): Promise<Record<NodeId, VaultAction>> {
    return await this.acl._transaction(async () => {
      const record: Record<NodeId, VaultAction> = {};
      const perms = await this.acl.getVaultPerm(vaultId as VaultId);
      for (const node in perms) {
        if (nodeId && nodeId === node) {
          record[node] = perms[node].vaults[vaultId];
        } else if (!nodeId) {
          record[node] = perms[node].vaults[vaultId];
        }
      }
      return record;
    });
  }

  /**
   * Clones a vault from another node
   *
   * @throws ErrorRemoteVaultUndefined if vaultName does not exist on
   * connected node
   * @throws ErrorNodeConnectionNotExist if the address of the node to connect to
   * does not exist
   * @throws ErrorRGitPermissionDenied if the node cannot access the desired vault
   * @param vaultId Id of vault
   * @param nodeId identifier of node to clone from
   */
  public async cloneVault(vaultId: string, nodeId: string): Promise<void> {
    // Create a connection to the specified node
    const nodeAddress = await this.nodeManager.getNode(nodeId as NodeId);
    if (!nodeAddress) {
      throw new nodesErrors.ErrorNodeConnectionNotExist(
        'Node does not exist in node store',
      );
    }
    this.nodeManager.createConnectionToNode(nodeId as NodeId, nodeAddress);
    const client = this.nodeManager.getClient(nodeId as NodeId);

    // Send a message to the connected agent to see if the clone can occur
    const vaultPermMessage = new agentPB.VaultPermMessage();
    vaultPermMessage.setNodeid(this.nodeManager.getNodeId());
    vaultPermMessage.setVaultid(vaultId);
    const permission = await client.checkVaultPermissions(vaultPermMessage);
    if (permission.getPermission() === false) {
      throw new gitErrors.ErrorGitPermissionDenied();
    }

    // Create the handler for git to clone from
    const gitRequest = await vaultUtils.constructGitHandler(
      client,
      this.nodeManager.getNodeId(),
    );

    // Search for the given vault Id and return the name
    const list = await gitRequest.scanVaults();
    let vaultName = vaultUtils.searchVaultName(list, vaultId);
    if (await this.getVaultId(vaultName)) {
      this.logger.warn(
        `'${vaultName}' already exists, cloned into '${vaultName} copy'`,
      );
      vaultName += ' copy';
    }
    await this.cloneVaultOps(gitRequest, vaultName, vaultId);
    await this.setDefaultNode(vaultId, nodeId);
  }

  /**
   * Pulls a vault from another node
   *
   * @throws ErrorVaultUnlinked if the vault does not have an already cloned repo
   * @throws ErrorVaultModified if changes have been made to the local repo
   * @throws ErrorNodeConnectionNotExist if the address of the node to connect to
   * does not exist
   * @throws ErrorRGitPermissionDenied if the node cannot access the desired vault
   * @param vaultId Id of vault
   * @param nodeId identifier of node to clone from
   */
   public async pullVault(vaultId: string, nodeId?: string): Promise<void> {
    let node = nodeId;
    if(!nodeId) {
      node = await this.getDefaultNode(vaultId);
    }
    if (!node) {
      throw new vaultErrors.ErrorVaultUnlinked(
        'Vault Id has not been cloned from remote repository',
      );
    }
    const nodeAddress = await this.nodeManager.getNode(node as NodeId);
    if (!nodeAddress) {
      throw new nodesErrors.ErrorNodeConnectionNotExist(
        'Node does not exist in node store',
      );
    }
    this.nodeManager.createConnectionToNode(node as NodeId, nodeAddress);
    const client = this.nodeManager.getClient(node as NodeId);

    // Send a message to the connected agent to see if the pull can occur
    const vaultPermMessage = new agentPB.VaultPermMessage();
    vaultPermMessage.setNodeid(this.nodeManager.getNodeId());
    vaultPermMessage.setVaultid(vaultId);
    const permission = await client.checkVaultPermissions(vaultPermMessage);
    if (permission.getPermission() === false) {
      throw new gitErrors.ErrorGitPermissionDenied();
    }

    // Create the handler for git to pull from
    const gitRequest = await vaultUtils.constructGitHandler(
      client,
      this.nodeManager.getNodeId(),
    );

    const list = await gitRequest.scanVaults();

    vaultUtils.searchVaultName(list, vaultId);

    const vault = await this.getVault(vaultId);
    await vault.pullVault(gitRequest);
    await this.setDefaultNode(vaultId, node);
  }

  /**
   * Returns a generator that yields the names of the vaults
   */
  public async *handleVaultNamesRequest(
    nodeId: string,
  ): AsyncGenerator<Uint8Array> {
    const vaults = await this.scanVaults(nodeId);
    for (const vault in vaults) {
      yield Buffer.from(`${vaults[vault].id}\t${vaults[vault].name}`);
    }
  }

  /* === Helpers === */
  /**
   * Generates a vault Id that is unique
   * @throws If a unique Id cannot be made after 50 attempts
   */
  private async generateVaultId(): Promise<string> {
    let vaultId = await vaultUtils.generateVaultId();
    let i = 0;
    while (1) {
      try {
        await this.getVault(vaultId);
      } catch (e) {
        if (e instanceof vaultErrors.ErrorVaultUndefined) {
          break;
        }
      }
      i++;
      if (i > 50) {
        throw new vaultErrors.ErrorCreateVaultId(
          'Could not create a unique vaultId after 50 attempts',
        );
      }
      vaultId = await vaultUtils.generateVaultId();
    }
    return vaultId;
  }

  /**
   * Creates an empty vault that can be cloned into
   *
   * @throws ErrorVaultDefined if vault with the same name already exists
   * @param vaultName Name of the new vault
   * @returns The newly created vault object
   */
   private async cloneVaultOps(gitHandler: GitRequest, vaultName: string, vaultId: string): Promise<void> {
    // Create the Vault instance and path
    await this.fs.promises.mkdir(path.join(this.vaultsPath, vaultId));
    const vault = new Vault({
      vaultId: vaultId,
      vaultName: vaultName,
      baseDir: path.join(this.vaultsPath, vaultId),
      fs: fs,
      logger: this.logger,
    });

    // Generate the key and store the vault in memory and on disk
    const key = await vaultUtils.generateVaultKey();
    await this.createVaultOps(vaultName, vaultId as VaultId, key);
    this.vaults[vaultId] = vault;
    await vault.cloneVault(gitHandler, key);
  }

  /**
   * Gets the vault id for a given vault name
   */
  private async getVaultIdByVaultName(
    vaultName: string,
  ): Promise<VaultId | undefined> {
    return await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.vaultsNamesDbDomain,
        vaultName,
      );
      if (vaultId == null) {
        return;
      }
      return vaultId.replace(/"/g, '') as VaultId;
    });
  }

  /**
   * Gets the vault key for a given vault id
   */
   private async getVaultKeyByVaultId(
    vaultId: VaultId,
  ): Promise<Buffer | undefined> {
    return await this._transaction(async () => {
      const vaultKey = await this.db.get<Buffer>(
        this.vaultsKeysDbDomain,
        vaultId,
      );
      if (vaultKey == null) {
        return;
      }
      return vaultKey;
    });
  }

  /**
   * Gets the vault link for a given vault id
   */
  private async getVaultNodeByVaultId(
    vaultId: VaultId,
  ): Promise<string | undefined> {
    return await this._transaction(async () => {
      const vaultLink = await this.db.get<string>(
        this.vaultsNodesDbDomain,
        vaultId,
      );
      if (vaultLink == null) {
        return;
      }
      return vaultLink.replace(/"/g, '');
    });
  }

  /**
   * Sets the default node Id to pull from for a vault Id
   */
  private async setVaultNodebyVaultId(
    vaultId: VaultId,
    vaultNode: string,
  ): Promise<void> {
    await this._transaction(async () => {
      await this.db.put(this.vaultsNodesDbDomain, vaultId, vaultNode);
    });
  }

  /**
   * Renames an existing vault name to a new vault name
   * If the existing vault name doesn't exist, nothing will change
   */
  private async renameVaultOps(
    vaultName: string,
    newVaultName: string,
  ): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.vaultsNamesDbDomain,
        vaultName,
      );
      if (!vaultId) {
        return;
      }
      const ops: Array<DBOp> = [
        {
          type: 'del',
          domain: this.vaultsNamesDbDomain,
          key: vaultName,
        },
        {
          type: 'put',
          domain: this.vaultsNamesDbDomain,
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
  private async createVaultOps(
    vaultName: string,
    vaultId: VaultId,
    vaultKey: Buffer,
  ): Promise<void> {
    await this._transaction(async () => {
      const existingId = await this.db.get<VaultId>(
        this.vaultsNamesDbDomain,
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
          domain: this.vaultsNamesDbDomain,
          key: vaultName,
          value: vaultId,
        },
        {
          type: 'put',
          domain: this.vaultsKeysDbDomain,
          key: vaultId,
          value: vaultKey,
        },
      ];
      await this.db.batch(ops);
    });
  }

  /**
   * Deletes a vault using an existing vault name
   * If the existing vault name doesn't exist, nothing will change
   */
   private async deleteVaultOps(vaultName: string): Promise<void> {
    await this._transaction(async () => {
      const vaultId = await this.db.get<VaultId>(
        this.vaultsNamesDbDomain,
        vaultName,
      );
      if (vaultId == null) {
        return;
      }
      const ops: Array<DBOp> = [
        {
          type: 'del',
          domain: this.vaultsNamesDbDomain,
          key: vaultName,
        },
        {
          type: 'del',
          domain: this.vaultsKeysDbDomain,
          key: vaultId,
        },
        {
          type: 'del',
          domain: this.vaultsNodesDbDomain,
          key: vaultId,
        },
      ];
      await this.db.batch(ops);
    });
  }

  private async setupVault(vaultId: string) {
    return await this._transaction(async () => {
      let vaultName: string = '';

      for await (const o of this.vaultsNamesDb.createReadStream({})) {
        const vId = (o as any).value;
        const name = (o as any).key as string;
        const id = this.db.unserializeDecrypt<VaultId>(vId) as string;
        if(vaultId === id) {
          vaultName = name;
          break;
        }
      }
      if(vaultName === '') {
        throw new vaultErrors.ErrorVaultUndefined();
      }
      const vaultKey = await this.getVaultKeyByVaultId(vaultId as VaultId);
      if(!vaultKey) {
        throw new vaultErrors.ErrorVaultUndefined();
      }
      this.vaults[vaultId] = new Vault({
          vaultId: vaultId,
          vaultName: vaultName,
          baseDir: path.join(this.vaultsPath, vaultId),
          fs: fs,
          logger: this.logger,
        });
      this.vaults[vaultId].start({ key: vaultKey });
    });
  }

  /**
   * Load existing vaults data into memory from vault metadata path.
   * If metadata does not exist, does nothing.
   */
   private async loadVaultData(): Promise<Vaults> {
    return await this._transaction(async () => {
      const names = {};
      const vaults: Vaults = {};

      for await (const o of this.vaultsNamesDb.createReadStream({})) {
        const id = (o as any).value;
        const name = (o as any).key as string;
        const vaultId = this.db.unserializeDecrypt<VaultId>(id) as string;
        names[vaultId] = name;
      }
      for await (const o of this.vaultsKeysDb.createReadStream({})) {
        const vaultId = (o as any).key;
        const key = (o as any).value;
        const vaultKey = this.db.unserializeDecrypt<Buffer>(key);
        const name = names[vaultId];
        const link = await this.getVaultNodeByVaultId(vaultId as VaultId);

        vaults[vaultId] =
          new Vault({
            vaultId: vaultId,
            vaultName: name,
            baseDir: path.join(this.vaultsPath, vaultId),
            fs: fs,
            logger: this.logger,
          });
        vaults[vaultId].start({ key: vaultKey });
      }
      return vaults;
    });
  }

  /**
   * Gives pulling permissions for a vault to one or more nodes
   *
   * @param nodeIds Id(s) of the nodes to share with
   * @param vaultId Id of the vault that the permissions are for
   */
   private async setVaultAction(
    nodeIds: string[],
    vaultId: string,
  ): Promise<void> {
    return await this.acl._transaction(async () => {
      for (const nodeId of nodeIds) {
        try {
          await this.acl.setVaultAction(
            vaultId as VaultId,
            nodeId as NodeId,
            'pull',
          );
        } catch (err) {
          if (err instanceof aclErrors.ErrorACLNodeIdMissing) {
            await this.acl.setNodePerm(nodeId as NodeId, {
              gestalt: {
                notify: null,
              },
              vaults: {},
            });
            await this.acl.setVaultAction(
              vaultId as VaultId,
              nodeId as NodeId,
              'pull',
            );
          }
        }
      }
    });
  }

  /**
   * Removes pulling permissions for a vault for one or more nodes
   *
   * @param nodeIds Id(s) of the nodes to remove permissions from
   * @param vaultId Id of the vault that the permissions are for
   */
  private async unsetVaultAction(
    nodeIds: string[],
    vaultId: string,
  ): Promise<void> {
    return await this.acl._transaction(async () => {
      for (const nodeId of nodeIds) {
        try {
          await this.acl.unsetVaultAction(
            vaultId as VaultId,
            nodeId as NodeId,
            'pull',
          );
        } catch (err) {
          if (err instanceof aclErrors.ErrorACLNodeIdMissing) {
            return;
          }
        }
      }
    });
  }
}

export default VaultManager;


    // const branch = await git.currentBranch({
    //   fs: vault.EncryptedFS,
    //   dir: vault.vaultId,
    //   fullname: false,
    // });
    // if (branch !== 'master') {
    //   throw new vaultsErrors.ErrorVaultModified(
    //     'Modified repository can no longer pull changes',
    //   );
    // }
