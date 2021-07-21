import type { VaultId } from '@/vaults/types';

import fs from 'fs';
import path from 'path';
import os from 'os';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';

import { KeyManager } from '@/keys';
import { VaultMap } from '@/vaults';
import { DB } from '@/db';

import * as vaultErrors from '@/vaults/errors';

describe('VaultMap is', () => {
  const logger = new Logger('VaultMap Test', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  let dataDir: string;
  let keyManager: KeyManager;
  let vaultMap: VaultMap;
  let db: DB;
  let vaultMapPath: string;

  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const keysPath = `${dataDir}/keys`;
    keyManager = new KeyManager({ keysPath, logger });
    await keyManager.start({ password: 'password' });
    const dbPath = `${dataDir}/db`;
    db = new DB({ dbPath, logger });
    await db.start({
      keyPair: keyManager.getRootKeyPair(),
    });
    vaultMapPath = path.join(dataDir, 'vaultdb');
  });

  afterEach(async () => {
    await db.stop();
    await keyManager.stop();
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });

  test('type correct', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    expect(vaultMap).toBeInstanceOf(VaultMap);
  });

  test('starting and stopping', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    await vaultMap.start({ fresh: true });

    expect(vaultMap.started).toBeTruthy();

    await vaultMap.stop();
  });

  test('putting a vault into storage', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    await vaultMap.start({ fresh: true });

    await vaultMap.setVault(
      'MyFirstVault',
      '12345' as VaultId,
      Buffer.from('test'),
    );
    await expect(
      vaultMap.getVaultLinkByVaultId('12345' as VaultId),
    ).resolves.toBe(undefined);
    await expect(vaultMap.getVaultIdByVaultName('MyFirstVault')).resolves.toBe(
      '12345',
    );

    await vaultMap.setVaultLink('12345' as VaultId, '1234567890');
    await expect(
      vaultMap.getVaultLinkByVaultId('12345' as VaultId),
    ).resolves.toBe('1234567890');

    await vaultMap.stop();
  });

  test('deleting a vault from storage', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    await vaultMap.start({ fresh: true });

    await vaultMap.setVault(
      'MyFirstVault',
      '12345' as VaultId,
      Buffer.from('test'),
    );
    await vaultMap.setVaultLink('12345' as VaultId, '1234567890');
    await vaultMap.delVault('MyFirstVault');
    await expect(
      vaultMap.getVaultLinkByVaultId('12345' as VaultId),
    ).resolves.toBe(undefined);
    await expect(vaultMap.getVaultIdByVaultName('MyFirstVault')).resolves.toBe(
      undefined,
    );

    await vaultMap.stop();
  });

  test('renaming a vault', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    await vaultMap.start({ fresh: true });

    await vaultMap.setVault(
      'MyFirstVault',
      '12345' as VaultId,
      Buffer.from('test'),
    );
    await vaultMap.setVaultLink('12345' as VaultId, '1234567890');
    await expect(
      vaultMap.getVaultLinkByVaultId('12345' as VaultId),
    ).resolves.toBe('1234567890');
    await expect(vaultMap.getVaultIdByVaultName('MyFirstVault')).resolves.toBe(
      '12345',
    );
    await vaultMap.renameVault('MyFirstVault', 'MyRenamedVault');
    await expect(vaultMap.getVaultIdByVaultName('MyFirstVault')).resolves.toBe(
      undefined,
    );
    await expect(
      vaultMap.getVaultIdByVaultName('MyRenamedVault'),
    ).resolves.toBe('12345' as VaultId);

    await vaultMap.stop();
  });
  test('maintaining unique vault names', async () => {
    vaultMap = new VaultMap({
      db: db,
      vaultMapPath: vaultMapPath,
      logger: logger,
    });
    await vaultMap.start({ fresh: true });

    await vaultMap.setVault('Test', '123' as VaultId, Buffer.from('test'));
    await expect(
      vaultMap.setVault('Test', '345' as VaultId, Buffer.from('test')),
    ).rejects.toThrow(vaultErrors.ErrorVaultDefined);

    await vaultMap.stop();
  });
});
