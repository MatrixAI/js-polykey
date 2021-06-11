import type Vault from './Vault';
import type { Opaque } from '../types';

/**
 * Randomly generated vault ID for each new vault
 */
type VaultId = Opaque<'VaultId', string>;

type VaultKey = Buffer;

/**
 * map vaultId -> Vault, VaultKey, VaultName
 */
type Vaults = {
  [key: string]: {
    vault: Vault;
    vaultKey: VaultKey;
    vaultName: string;
    vaultLink?: string;
  };
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

export type { VaultKey, Vaults, NodePermissions, ACL, FileChange, FileChanges, VaultId };
