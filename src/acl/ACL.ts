import type { PermissionId, Permission, VaultActions } from './types';
import type { DB } from '../db';
import type { DBLevel, DBOp } from '../db/types';
import type { NodeId } from '../nodes/types';
import type { GestaltAction } from '../gestalts/types';
import type { VaultAction, VaultId } from '../vaults/types';
import type { FileSystem, Ref } from '../types';

import { Mutex } from 'async-mutex';
import Logger from '@matrixai/logger';
import { errors as dbErrors } from '../db';
import * as aclUtils from './utils';
import * as aclErrors from './errors';

class ACL {
  protected logger: Logger;
  protected fs: FileSystem;

  protected db: DB;
  protected aclDbDomain: string = this.constructor.name;
  protected aclPermsDbDomain: Array<string> = [this.aclDbDomain, 'perms'];
  protected aclNodesDbDomain: Array<string> = [this.aclDbDomain, 'nodes'];
  protected aclVaultsDbDomain: Array<string> = [this.aclDbDomain, 'vaults'];
  protected aclDb: DBLevel<string>;
  protected aclPermsDb: DBLevel<PermissionId>;
  protected aclNodesDb: DBLevel<NodeId>;
  protected aclVaultsDb: DBLevel<VaultId>;
  protected lock: Mutex = new Mutex();
  protected _started: boolean = false;

  constructor({ db, logger }: { db: DB; logger?: Logger }) {
    this.logger = logger ?? new Logger(this.constructor.name);
    this.db = db;
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
      this.logger.info('Starting ACL');
      this._started = true;
      if (!this.db.started) {
        throw new dbErrors.ErrorDBNotStarted();
      }
      const aclDb = await this.db.level<string>(this.aclDbDomain);
      // perms stores PermissionId -> Ref<Permission>
      const aclPermsDb = await this.db.level<PermissionId>(
        this.aclPermsDbDomain[1],
        aclDb,
      );
      // nodes stores NodeId -> PermissionId
      const aclNodesDb = await this.db.level<NodeId>(
        this.aclNodesDbDomain[1],
        aclDb,
      );
      // vaults stores VaultId -> Record<NodeId, null>
      // note that the NodeId in each array must be in their own unique gestalt
      // the NodeId in each array may be missing if it had been previously deleted
      const aclVaultsDb = await this.db.level<VaultId>(
        this.aclVaultsDbDomain[1],
        aclDb,
      );
      if (fresh) {
        await aclDb.clear();
      }
      this.aclDb = aclDb;
      this.aclPermsDb = aclPermsDb;
      this.aclNodesDb = aclNodesDb;
      this.aclVaultsDb = aclVaultsDb;
      this.logger.info('Started ACL');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  async stop() {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping ACL');
    this._started = false;
    this.logger.info('Stopped ACL');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
  public async transaction<T>(f: (acl: ACL) => Promise<T>): Promise<T> {
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
  protected async _transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this.lock.isLocked()) {
      return await f();
    } else {
      return await this.transaction(f);
    }
  }

  public async getNodePerms(): Promise<Array<Record<NodeId, Permission>>> {
    return await this._transaction(async () => {
      const permIds: Record<PermissionId, Record<NodeId, Permission>> = {};
      for await (const o of this.aclNodesDb.createReadStream()) {
        const nodeId = (o as any).key as NodeId;
        const data = (o as any).value as Buffer;
        const permId = this.db.unserializeDecrypt<PermissionId>(data);
        let nodePerm: Record<NodeId, Permission>;
        if (permId in permIds) {
          nodePerm = permIds[permId];
          // get the first existing perm object
          let perm: Permission;
          for (const nodeId_ in nodePerm) {
            perm = nodePerm[nodeId_];
            break;
          }
          // all perm objects are shared
          nodePerm[nodeId] = perm!;
        } else {
          const permRef = (await this.db.get(
            this.aclPermsDbDomain,
            permId,
          )) as Ref<Permission>;
          nodePerm = { [nodeId]: permRef.object };
          permIds[permId] = nodePerm;
        }
      }
      const nodePerms_: Array<Record<NodeId, Permission>> = [];
      for (const permId in permIds) {
        nodePerms_.push(permIds[permId]);
      }
      return nodePerms_;
    });
  }

  public async getVaultPerms(): Promise<
    Record<VaultId, Record<NodeId, Permission>>
  > {
    return await this._transaction(async () => {
      const vaultPerms: Record<VaultId, Record<NodeId, Permission>> = {};
      const ops: Array<DBOp> = [];
      for await (const o of this.aclVaultsDb.createReadStream()) {
        const vaultId = (o as any).key as VaultId;
        const data = (o as any).value as Buffer;
        const nodeIds = this.db.unserializeDecrypt<Record<NodeId, null>>(data);
        const nodePerm: Record<NodeId, Permission> = {};
        const nodeIdsGc: Set<NodeId> = new Set();
        for (const nodeId in nodeIds) {
          const permId = await this.db.get<PermissionId>(
            this.aclNodesDbDomain,
            nodeId as NodeId,
          );
          if (permId == null) {
            // invalid node id
            nodeIdsGc.add(nodeId as NodeId);
            continue;
          }
          const permRef = (await this.db.get(
            this.aclPermsDbDomain,
            permId,
          )) as Ref<Permission>;
          if (!(vaultId in permRef.object.vaults)) {
            // vault id is missing from the perm
            nodeIdsGc.add(nodeId as NodeId);
            continue;
          }
          nodePerm[nodeId] = permRef.object;
        }
        if (nodeIdsGc.size > 0) {
          // remove invalid node ids
          for (const nodeId of nodeIdsGc) {
            delete nodeIds[nodeId];
          }
          ops.push({
            type: 'put',
            domain: this.aclVaultsDbDomain,
            key: vaultId,
            value: nodeIds,
          });
        }
        vaultPerms[vaultId] = nodePerm;
      }
      await this.db.batch(ops);
      return vaultPerms;
    });
  }

  /**
   * Gets the permission record for a given node id
   * Any node id is acceptable
   */
  public async getNodePerm(nodeId: NodeId): Promise<Permission | undefined> {
    return await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        return;
      }
      const perm = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      return perm.object;
    });
  }

  /**
   * Gets the record of node ids to permission for a given vault id
   * The node ids in the record each represent a unique gestalt
   * If there are no permissions, then an empty record is returned
   */
  public async getVaultPerm(
    vaultId: VaultId,
  ): Promise<Record<NodeId, Permission>> {
    return await this._transaction(async () => {
      const nodeIds = await this.db.get<Record<NodeId, null>>(
        this.aclVaultsDbDomain,
        vaultId,
      );
      if (nodeIds == null) {
        return {};
      }
      const perms: Record<NodeId, Permission> = {};
      const nodeIdsGc: Set<NodeId> = new Set();
      for (const nodeId in nodeIds) {
        const permId = await this.db.get<PermissionId>(
          this.aclNodesDbDomain,
          nodeId as NodeId,
        );
        if (permId == null) {
          // invalid node id
          nodeIdsGc.add(nodeId as NodeId);
          continue;
        }
        const permRef = (await this.db.get(
          this.aclPermsDbDomain,
          permId,
        )) as Ref<Permission>;
        if (!(vaultId in permRef.object.vaults)) {
          // vault id is missing from the perm
          nodeIdsGc.add(nodeId as NodeId);
          continue;
        }
        perms[nodeId] = permRef.object;
      }
      if (nodeIdsGc.size > 0) {
        // remove invalid node ids
        for (const nodeId of nodeIdsGc) {
          delete nodeIds[nodeId];
        }
        await this.db.put(this.aclVaultsDbDomain, vaultId, nodeIds);
      }
      return perms;
    });
  }

  public async setNodeAction(
    nodeId: NodeId,
    action: GestaltAction,
  ): Promise<void> {
    return await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      const ops: Array<DBOp> = [];
      if (permId == null) {
        const permId = await aclUtils.generatePermId();
        const permRef = {
          count: 1,
          object: {
            gestalt: {
              [action]: null,
            },
            vaults: {},
          },
        };
        ops.push(
          {
            type: 'put',
            domain: this.aclPermsDbDomain,
            key: permId,
            value: permRef,
          },
          {
            type: 'put',
            domain: this.aclNodesDbDomain,
            key: nodeId,
            value: permId,
          },
        );
      } else {
        const permRef = (await this.db.get(
          this.aclPermsDbDomain,
          permId,
        )) as Ref<Permission>;
        permRef.object.gestalt[action] = null;
        ops.push({
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: permRef,
        });
      }
      await this.db.batch(ops);
    });
  }

  public async unsetNodeAction(
    nodeId: NodeId,
    action: GestaltAction,
  ): Promise<void> {
    return await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        return;
      }
      const permRef = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      delete permRef.object.gestalt[action];
      await this.db.put(this.aclPermsDbDomain, permId, permRef);
    });
  }

  public async setVaultAction(
    vaultId: VaultId,
    nodeId: NodeId,
    action: VaultAction,
  ): Promise<void> {
    return await this._transaction(async () => {
      const nodeIds =
        (await this.db.get<Record<NodeId, null>>(
          this.aclVaultsDbDomain,
          vaultId,
        )) ?? {};
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        throw new aclErrors.ErrorACLNodeIdMissing();
      }
      nodeIds[nodeId] = null;
      const permRef = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      let actions: VaultActions | undefined = permRef.object.vaults[vaultId];
      if (actions == null) {
        actions = {};
        permRef.object.vaults[vaultId] = actions;
      }
      actions[action] = null;
      const ops: Array<DBOp> = [
        {
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: permRef,
        },
        {
          type: 'put',
          domain: this.aclNodesDbDomain,
          key: nodeId,
          value: permId,
        },
        {
          type: 'put',
          domain: this.aclVaultsDbDomain,
          key: vaultId,
          value: nodeIds,
        },
      ];
      await this.db.batch(ops);
    });
  }

  public async unsetVaultAction(
    vaultId: VaultId,
    nodeId: NodeId,
    action: VaultAction,
  ): Promise<void> {
    await this._transaction(async () => {
      const nodeIds = await this.db.get<Record<NodeId, null>>(
        this.aclVaultsDbDomain,
        vaultId,
      );
      if (nodeIds == null || !(nodeId in nodeIds)) {
        return;
      }
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        return;
      }
      const permRef = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      const actions: VaultActions | undefined = permRef.object.vaults[vaultId];
      if (actions == null) {
        return;
      }
      delete actions[action];
      await this.db.put(this.aclPermsDbDomain, permId, permRef);
    });
  }

  public async setNodesPerm(
    nodeIds: Array<NodeId>,
    perm: Permission,
  ): Promise<void> {
    await this._transaction(async () => {
      for (const nodeId of nodeIds) {
        // only new nodeIds are allowed
        if (
          (await this.db.get<PermissionId>(this.aclNodesDbDomain, nodeId)) !=
          null
        ) {
          throw new aclErrors.ErrorACLNodeIdExists();
        }
      }
      const ops: Array<DBOp> = [];
      const permId = await aclUtils.generatePermId();
      const permRef = {
        count: nodeIds.length,
        object: perm,
      };
      ops.push({
        domain: this.aclPermsDbDomain,
        type: 'put',
        key: permId,
        value: permRef,
      });
      for (const nodeId of nodeIds) {
        ops.push({
          domain: this.aclNodesDbDomain,
          type: 'put',
          key: nodeId,
          value: permId,
        });
      }
      await this.db.batch(ops);
    });
  }

  public async setNodePerm(nodeId: NodeId, perm: Permission): Promise<void> {
    await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      const ops: Array<DBOp> = [];
      if (permId == null) {
        const permId = await aclUtils.generatePermId();
        const permRef = {
          count: 1,
          object: perm,
        };
        ops.push(
          {
            type: 'put',
            domain: this.aclPermsDbDomain,
            key: permId,
            value: permRef,
          },
          {
            type: 'put',
            domain: this.aclNodesDbDomain,
            key: nodeId,
            value: permId,
          },
        );
      } else {
        // the entire gestalt's perm gets replaced, therefore the count stays the same
        const permRef = (await this.db.get(
          this.aclPermsDbDomain,
          permId,
        )) as Ref<Permission>;
        permRef.object = perm;
        ops.push({
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: permRef,
        });
      }
      await this.db.batch(ops);
    });
  }

  public async unsetNodePerm(nodeId: NodeId): Promise<void> {
    await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        return;
      }
      const ops: Array<DBOp> = [];
      const perm = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      const count = --perm.count;
      if (count === 0) {
        ops.push({
          type: 'del',
          domain: this.aclPermsDbDomain,
          key: permId,
        });
      } else {
        ops.push({
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: perm,
        });
      }
      ops.push({
        type: 'del',
        domain: this.aclNodesDbDomain,
        key: nodeId,
      });
      // we do not remove the node id from the vaults
      // they can be removed later upon inspection
      await this.db.batch(ops);
    });
  }

  public async unsetVaultPerms(vaultId: VaultId): Promise<void> {
    await this._transaction(async () => {
      const nodeIds = await this.db.get<Record<NodeId, null>>(
        this.aclVaultsDbDomain,
        vaultId,
      );
      if (nodeIds == null) {
        return;
      }
      const ops: Array<DBOp> = [];
      for (const nodeId in nodeIds) {
        const permId = await this.db.get<PermissionId>(
          this.aclNodesDbDomain,
          nodeId as NodeId,
        );
        // skip if the nodeId doesn't exist
        // this means that it previously been removed
        if (permId == null) {
          continue;
        }
        const perm = (await this.db.get(
          this.aclPermsDbDomain,
          permId,
        )) as Ref<Permission>;
        delete perm.object.vaults[vaultId];
        ops.push({
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: perm,
        });
      }
      ops.push({
        type: 'del',
        domain: this.aclVaultsDbDomain,
        key: vaultId,
      });
      await this.db.batch(ops);
    });
  }

  public async joinNodePerm(
    nodeId: NodeId,
    nodeIdsJoin: Array<NodeId>,
  ): Promise<void> {
    await this._transaction(async () => {
      const permId = await this.db.get<PermissionId>(
        this.aclNodesDbDomain,
        nodeId,
      );
      if (permId == null) {
        throw new aclErrors.ErrorACLNodeIdMissing();
      }
      const ops: Array<DBOp> = [];
      const permRef = (await this.db.get(
        this.aclPermsDbDomain,
        permId,
      )) as Ref<Permission>;
      for (const nodeIdJoin of nodeIdsJoin) {
        const permIdJoin = await this.db.get<PermissionId>(
          this.aclNodesDbDomain,
          nodeIdJoin,
        );
        if (permIdJoin === permId) {
          continue;
        }
        ++permRef.count;
        if (permIdJoin != null) {
          const permJoin = (await this.db.get(
            this.aclPermsDbDomain,
            permIdJoin,
          )) as Ref<Permission>;
          --permJoin.count;
          if (permJoin.count === 0) {
            ops.push({
              type: 'del',
              domain: this.aclPermsDbDomain,
              key: permIdJoin,
            });
          } else {
            ops.push({
              type: 'put',
              domain: this.aclPermsDbDomain,
              key: permIdJoin,
              value: permJoin,
            });
          }
        }
        ops.push({
          type: 'put',
          domain: this.aclNodesDbDomain,
          key: nodeIdJoin,
          value: permId,
        });
      }
      ops.push({
        type: 'put',
        domain: this.aclPermsDbDomain,
        key: permId,
        value: permRef,
      });
      await this.db.batch(ops);
    });
  }

  public async joinVaultPerms(
    vaultId: VaultId,
    vaultIdsJoin: Array<VaultId>,
  ): Promise<void> {
    await this._transaction(async () => {
      const nodeIds = await this.db.get<Record<NodeId, null>>(
        this.aclVaultsDbDomain,
        vaultId,
      );
      if (nodeIds == null) {
        throw new aclErrors.ErrorACLVaultIdMissing();
      }
      const ops: Array<DBOp> = [];
      const nodeIdsGc: Set<NodeId> = new Set();
      for (const nodeId in nodeIds) {
        const permId = await this.db.get<PermissionId>(
          this.aclNodesDbDomain,
          nodeId as NodeId,
        );
        if (permId == null) {
          // invalid node id
          nodeIdsGc.add(nodeId as NodeId);
          continue;
        }
        const permRef = (await this.db.get(
          this.aclPermsDbDomain,
          permId,
        )) as Ref<Permission>;
        if (!(vaultId in permRef.object.vaults)) {
          // vault id is missing from the perm
          nodeIdsGc.add(nodeId as NodeId);
          continue;
        }
        const vaultActions: VaultActions | undefined =
          permRef.object.vaults[vaultId];
        for (const vaultIdJoin of vaultIdsJoin) {
          permRef.object.vaults[vaultIdJoin] = vaultActions;
        }
        ops.push({
          type: 'put',
          domain: this.aclPermsDbDomain,
          key: permId,
          value: permRef,
        });
      }
      for (const vaultIdJoin of vaultIdsJoin) {
        ops.push({
          type: 'put',
          domain: this.aclVaultsDbDomain,
          key: vaultIdJoin,
          value: nodeIds,
        });
      }
      if (nodeIdsGc.size > 0) {
        // remove invalid node ids
        for (const nodeId of nodeIdsGc) {
          delete nodeIds[nodeId];
        }
        ops.push({
          type: 'put',
          domain: this.aclVaultsDbDomain,
          key: vaultId,
          value: nodeIds,
        });
      }
      await this.db.batch(ops);
    });
  }
}

export default ACL;