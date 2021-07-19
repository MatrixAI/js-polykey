import type Vault from './Vault';
import type { Opaque } from '../types';

/**
 * Randomly generated vault ID for each new vault
 */
type VaultId = Opaque<'VaultId', string>;

/**
 * Actions relating to what is possible with vaults
 */
type VaultAction = 'clone' | 'pull';

type VaultKey = Buffer;

/**
 * map vaultId -> Vault
 */
type Vaults = {
  [vaultId: string]: Vault;
};

type NodePermissions = {
  canPull: boolean;
};

type ACL = {
  [key: string]: NodePermissions;
};

type FileChange = {
  fileName: string;
  action: 'added' | 'modified' | 'removed';
};

type FileChanges = Array<FileChange>;

type VaultMapOp_ =
  | {
      domain: 'vaults';
      key: VaultId;
      value: Buffer;
    }
  | {
      domain: 'names';
      key: string;
      value: VaultId;
    }
  | {
      domain: 'links';
      key: VaultId;
      value: string;
    };

type VaultMapOp =
  | ({
      type: 'put';
    } & VaultMapOp_)
  | ({
      type: 'del';
    } & Omit<VaultMapOp_, 'value'>);

type VaultActions = Partial<Record<VaultAction, null>>;

export type {
  VaultId,
  VaultAction,
  VaultKey,
  Vaults,
  NodePermissions,
  ACL,
  FileChange,
  FileChanges,
  VaultMapOp,
  VaultActions,
};
