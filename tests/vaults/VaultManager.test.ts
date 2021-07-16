import type { NodeId, NodeInfo } from '@/nodes/types';
import { ProviderId, IdentityId, IdentityInfo } from '@/identities/types';

import os from 'os';
import path from 'path';
import fs from 'fs';
import level from 'level';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { KeyManager } from '@/keys';
import { VaultManager } from '@/vaults';
import { ACL } from '@/acl';
import { GestaltGraph } from '@/gestalts';
import { DB } from '@/db';

import * as errors from '@/vaults/errors';

describe('VaultManager is', () => {
  const logger = new Logger('VaultManager Test', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  let dataDir: string;
  let keyManager: KeyManager;
  let db: DB;
  let acl: ACL;
  let gestaltGraph: GestaltGraph;
  let vaultManager: VaultManager;
  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const keysPath = `${dataDir}/keys`;
    keyManager = new KeyManager({ keysPath, logger });
    await keyManager.start({ password: 'password' });
    const dbPath = path.join(dataDir, 'vaults');
    const vaultPath = path.join(dataDir, 'vaults');
    db = new DB({ dbPath, logger });
    await db.start({
      keyPair: keyManager.getRootKeyPair(),
    });
    acl = new ACL({
      db: db,
      logger: logger,
    });
    await acl.start();
    gestaltGraph = new GestaltGraph({
      db: db,
      acl: acl,
      logger: logger,
    });
    await gestaltGraph.start();
    vaultManager = new VaultManager({
      vaultsPath: ,
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
  });
  afterEach(async () => {
    await gestaltGraph.stop();
    await acl.stop();
    await db.stop();
    await keyManager.stop();
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });
  test('type correct', () => {
    expect(vaultManager).toBeInstanceOf(VaultManager);
  });
  test('starting and stopping', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
    await vaultManager.start({});

    expect(await vaultManager.started()).toBe(true);

    await vaultManager.stop();
  });
  test('creating the directory', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
    await vaultManager.start({});

    expect(await fs.promises.stat(dataDir)).toBeTruthy();

    await vaultManager.stop();
  });
  test('checking gestalt permissions for vaults', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    const node1: NodeInfo = {
      id: '123' as NodeId,
      chain: {},
    };
    const node2: NodeInfo = {
      id: '345' as NodeId,
      chain: {},
    };
    const node3: NodeInfo = {
      id: '678' as NodeId,
      chain: {},
    };
    const node4: NodeInfo = {
      id: '890' as NodeId,
      chain: {},
    };
    const id1: IdentityInfo = {
      providerId: 'github.com' as ProviderId,
      identityId: 'abc' as IdentityId,
      claims: {},
    };
    const id2: IdentityInfo = {
      providerId: 'github.com' as ProviderId,
      identityId: 'def' as IdentityId,
      claims: {},
    };

    await gestaltGraph.setNode(node1);
    await gestaltGraph.setNode(node2);
    await gestaltGraph.setNode(node3);
    await gestaltGraph.setNode(node4);
    await gestaltGraph.setIdentity(id1);
    await gestaltGraph.setIdentity(id2);

    await gestaltGraph.linkNodeAndNode(node1, node2);
    await gestaltGraph.linkNodeAndIdentity(node1, id1);
    await gestaltGraph.linkNodeAndIdentity(node4, id2);

    await vaultManager.start({});

    const vault = await vaultManager.createVault('Test');

    await vaultManager.setVaultPerm('123', vault.vaultId);

    let record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeNull();
    expect(record['345']['pull']).toBeNull();
    expect(record['678']).toBeUndefined();
    expect(record['890']).toBeUndefined();

    await vaultManager.unsetVaultPerm('345', vault.vaultId);

    record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeUndefined();
    expect(record['345']['pull']).toBeUndefined();

    await gestaltGraph.unlinkNodeAndNode(node1.id, node2.id);

    await vaultManager.setVaultPerm('345', vault.vaultId);

    record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeUndefined();
    expect(record['345']['pull']).toBeNull();

    await vaultManager.stop();
  });
  test('able to create a vault', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
    await vaultManager.start({});

    const vault = await vaultManager.createVault('MyTestVault');

    expect(vault).toBeTruthy();

    await vaultManager.stop();
  });
  test('able to create and get a vault', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
    await vaultManager.start({});

    const newVault = await vaultManager.createVault('MyTestVault');
    const theVault = vaultManager.getVault(newVault.vaultId);

    expect(newVault).toBe(theVault);
    expect(() => vaultManager.getVault('DoesNotExist')).toThrow(
      errors.ErrorVaultUndefined,
    );

    await vaultManager.stop();
  });
  test('able to rename a vault', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });
    await vaultManager.start({});

    const newVault = await vaultManager.createVault('MyTestVault');
    const result = await vaultManager.renameVault(
      newVault.vaultId,
      'MyBetterTestVault',
    );

    expect(result).toBe(true);
    expect(vaultManager.getVault(newVault.vaultId)).toBe(newVault);
    expect(() => vaultManager.getVault('DoesNotExist')).toThrow(
      errors.ErrorVaultUndefined,
    );

    await vaultManager.stop();
  });
  test('able to delete a vault', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    await vaultManager.start({});

    const firstVault = await vaultManager.createVault('MyFirstVault');
    const secondVault = await vaultManager.createVault('MySecondVault');
    const thirdVault = await vaultManager.createVault('MyThirdVault');
    const result = await vaultManager.deleteVault(secondVault.vaultId);

    expect(result).toBe(true);
    expect(vaultManager.getVault(firstVault.vaultId)).toBe(firstVault);
    expect(() => {
      vaultManager.getVault(secondVault.vaultId);
    }).toThrow(`${secondVault.vaultId} does not exist`);
    expect(vaultManager.getVault(thirdVault.vaultId)).toBe(thirdVault);

    await vaultManager.stop();
  });
  test('able to list vaults', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    await vaultManager.start({});

    await vaultManager.createVault('MyTestVault');
    await vaultManager.createVault('MyOtherTestVault');

    const vn: Array<string> = [];
    vaultManager.listVaults().forEach((a) => vn.push(a.name));
    expect(vn.sort()).toEqual(['MyTestVault', 'MyOtherTestVault'].sort());

    await vaultManager.stop();
  });
  test('able to get vault stats', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    await vaultManager.start({});

    const vault1 = await vaultManager.createVault('MyTestVault');
    const vault2 = await vaultManager.createVault('MyOtherTestVault');

    const stat1 = await vaultManager.vaultStats(vault1.vaultId);
    const stat2 = await vaultManager.vaultStats(vault2.vaultId);

    expect(stat1.ctime < stat2.ctime).toBeTruthy();

    await vaultManager.stop();
  });
  test('able to create many vaults', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    const vaultNames = [
      'Vault1',
      'Vault2',
      'Vault3',
      'Vault4',
      'Vault5',
      'Vault6',
      'Vault7',
      'Vault8',
      'Vault9',
      'Vault10',
      'Vault11',
      'Vault12',
      'Vault13',
      'Vault14',
      'Vault15',
      'Vault16',
      'Vault17',
      'Vault18',
      'Vault19',
      'Vault20',
    ];

    await vaultManager.start({});
    for (const vaultName of vaultNames) {
      await vaultManager.createVault(vaultName);
    }

    expect(vaultManager.listVaults().length).toEqual(vaultNames.length);

    await vaultManager.stop();
  });
  test('able to write metadata', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    await vaultManager.start({});

    await vaultManager.createVault('MyVault');

    await vaultManager.stop();

    const leveldb = await level(vaultManager.vaultsPath);
    await leveldb.open();
    leveldb.createReadStream().on('data', (data) => {
      expect(data).toBeTruthy();
    });
    await leveldb.close();
  });
  test('able to read and load existing metadata', async () => {
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    const vaultNames = [
      'Vault1',
      'Vault2',
      'Vault3',
      'Vault4',
      'Vault5',
      'Vault6',
      'Vault7',
      'Vault8',
      'Vault9',
      'Vault10',
    ];

    await vaultManager.start({});

    for (const vaultName of vaultNames) {
      await vaultManager.createVault(vaultName);
    }
    const vaults = vaultManager.listVaults();
    let vaultId: string = '';
    for (const v of vaults) {
      if (v.name === 'Vault1') {
        vaultId = v.id;
        break;
      }
    }
    expect(vaultId).not.toBe('');

    const vault = vaultManager.getVault(vaultId);
    const id = vault.vaultId;
    await vaultManager.setLinkVault(id, '12345667889');
    expect(vault).toBeTruthy();
    // vault = vaultManager.getVault('Vault1');

    await vaultManager.stop();
    await gestaltGraph.stop();
    await acl.stop();
    await db.stop();

    await db.start({
      keyPair: keyManager.getRootKeyPair(),
    });
    await acl.start();
    await gestaltGraph.start();
    await vaultManager.start({});

    const vaults2 = vaultManager.listVaults();
    let vaultId2: string = '';
    for (const v of vaults2) {
      if (v.name === 'Vault1') {
        vaultId2 = v.id;
        break;
      }
    }
    // implicit test of keys
    expect(vault.EncryptedFS.Stats).toEqual(
      vaultManager.getVault(vaultId2).EncryptedFS.Stats,
    );
    const vn: Array<string> = [];
    vaultManager.listVaults().forEach((a) => vn.push(a.name));
    expect(vn.sort()).toEqual(vaultNames.sort());

    expect(vaultManager.getLinkVault('12345667889')?.vaultId).toBe(id);

    await vaultManager.stop();
    await gestaltGraph.stop();
    await acl.stop();
    await db.stop();
  });
  test('able to recover metadata after complex operations', async () => {
    const vaultNames = [
      'Vault1',
      'Vault2',
      'Vault3',
      'Vault4',
      'Vault5',
      'Vault6',
      'Vault7',
      'Vault8',
      'Vault9',
      'Vault10',
    ];
    const alteredVaultNames = [
      'Vault1',
      'Vault2',
      'Vault3',
      'Vault4',
      'Vault6',
      'Vault7',
      'Vault8',
      'Vault10',
      'ThirdImpact',
      'Cake',
    ];
    const vaultManager = new VaultManager({
      vaultsPath: path.join(dataDir, 'vaults'),
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    await vaultManager.start({});

    for (const vaultName of vaultNames) {
      await vaultManager.createVault(vaultName);
    }
    const v10 = vaultManager.getVaultId('Vault10');
    expect(v10).toBeTruthy();
    await vaultManager.deleteVault(v10!);
    const v5 = vaultManager.getVaultId('Vault5');
    expect(v5).toBeTruthy();
    await vaultManager.deleteVault(v5!);
    const v9 = vaultManager.getVaultId('Vault9');
    expect(v9).toBeTruthy();
    const vault9 = vaultManager.getVault(v9!);
    await vaultManager.renameVault(v9!, 'Vault10');
    await vaultManager.createVault('ThirdImpact');
    await vaultManager.createVault('Cake');
    await vault9.create();
    await vault9.initializeVault();
    await vault9.addSecret('MySecret', Buffer.from('MyActualPassword'));

    const vn: Array<string> = [];
    vaultManager.listVaults().forEach((a) => vn.push(a.name));
    expect(vn.sort()).toEqual(alteredVaultNames.sort());

    await vaultManager.stop();
    await gestaltGraph.stop();
    await acl.stop();
    await db.stop();

    await db.start({
      keyPair: keyManager.getRootKeyPair(),
    });
    await acl.start();
    await gestaltGraph.start();
    await vaultManager.start({});

    await vaultManager.createVault('Pumpkin');

    // implicit test of keys
    const v102 = vaultManager.getVaultId('Vault10');
    expect(v102).toBeTruthy();
    expect(vault9.EncryptedFS.Stats).toEqual(
      vaultManager.getVault(v102!).EncryptedFS.Stats,
    );
    const secret = await vaultManager.getVault(v102!).getSecret('MySecret');
    expect(secret.toString()).toBe('MyActualPassword');
    alteredVaultNames.push('Pumpkin');
    expect(vaultManager.listVaults().length).toEqual(alteredVaultNames.length);

    await vaultManager.stop();
    await gestaltGraph.stop();
    await acl.stop();
    await db.stop();
  });
});

// Old tests for setting Vault Actions (are private now)
// test('setting vault permissions', async () => {
//   const vaultManager = new VaultManager({
//     vaultsPath: path.join(dataDir, 'vaults'),
//     keyManager: keyManager,
//     db: db,
//     acl: acl,
//     gestaltGraph: gestaltGraph,
//     fs: fs,
//     logger: logger,
//   });
//   await vaultManager.start({});
//   const vault = await vaultManager.createVault('Test');
//   await vaultManager.setVaultAction(['1234567'], vault.vaultId);
//   const record = await acl.getNodePerm('1234567' as NodeId);
//   expect(record?.vaults[vault.vaultId]['pull']).toBeNull();
//   expect(record?.vaults[vault.vaultId]['clone']).toBeUndefined();
//   await expect(acl.getNodePerm('1234568' as NodeId)).resolves.toBeUndefined();
//   await vaultManager.setVaultAction(['1', '2', '3', '4', '5'], vault.vaultId);
//   await vaultManager.unsetVaultAction(['5'], vault.vaultId);
//   const perms = await acl.getVaultPerm(vault.vaultId as VaultId);
//   expect(perms['1'].vaults[vault.vaultId]['pull']).toBeNull();
//   expect(perms['2'].vaults[vault.vaultId]['pull']).toBeNull();
//   expect(perms['3'].vaults[vault.vaultId]['pull']).toBeNull();
//   expect(perms['4'].vaults[vault.vaultId]['pull']).toBeNull();
//   expect(perms['5'].vaults[vault.vaultId]['pull']).toBeUndefined();

//   await vaultManager.stop();
// });
// test('unsetting vault permissions', async () => {
//   const vaultManager = new VaultManager({
//     vaultsPath: path.join(dataDir, 'vaults'),
//     keyManager: keyManager,
//     db: db,
//     acl: acl,
//     gestaltGraph: gestaltGraph,
//     fs: fs,
//     logger: logger,
//   });
//   await vaultManager.start({});
//   const vault = await vaultManager.createVault('Test');
//   await vaultManager.setVaultAction(['1234567'], vault.vaultId);
//   await vaultManager.unsetVaultAction(['1234567'], vault.vaultId);
//   const record = await acl.getNodePerm('1234567' as NodeId);
//   expect(record?.vaults[vault.vaultId]['pull']).toBeUndefined();
//   await vaultManager.setVaultAction(['1', '2', '3', '4', '5'], vault.vaultId);
//   await vaultManager.unsetVaultAction(['2', '3', '4', '5'], vault.vaultId);
//   const perms = await acl.getVaultPerm(vault.vaultId as VaultId);
//   expect(perms['1'].vaults[vault.vaultId]['pull']).toBeNull();
//   expect(perms['2'].vaults[vault.vaultId]['pull']).toBeUndefined();
//   expect(perms['3'].vaults[vault.vaultId]['pull']).toBeUndefined();
//   expect(perms['4'].vaults[vault.vaultId]['pull']).toBeUndefined();
//   expect(perms['5'].vaults[vault.vaultId]['pull']).toBeUndefined();
//   await vaultManager.stop();
// });
// test('checking the vault permissions', async () => {
//   const vaultManager = new VaultManager({
//     vaultsPath: path.join(dataDir, 'vaults'),
//     keyManager: keyManager,
//     db: db,
//     acl: acl,
//     gestaltGraph: gestaltGraph,
//     fs: fs,
//     logger: logger,
//   });
//   await vaultManager.start({});
//   const vault = await vaultManager.createVault('Test');
//   await vaultManager.setVaultAction(
//     ['one', 'two', 'three', 'four', 'five', 'six'],
//     vault.vaultId,
//   );
//   await vaultManager.unsetVaultAction(
//     ['one', 'three', 'five'],
//     vault.vaultId,
//   );
//   const record = await vaultManager.getVaultPermissions(vault.vaultId);
//   expect(record).not.toBeUndefined();
//   expect(record['one']['pull']).toBeUndefined();
//   expect(record['three']['pull']).toBeUndefined();
//   expect(record['five']['pull']).toBeUndefined();
//   expect(record['two']['pull']).toBeNull();
//   expect(record['four']['pull']).toBeNull();
//   expect(record['six']['pull']).toBeNull();
//   const perm = await vaultManager.getVaultPermissions(vault.vaultId, 'two');
//   expect(perm['two']['pull']).toBeNull();
//   expect(perm['four']).toBeUndefined();
//   await vaultManager.stop();
// });
