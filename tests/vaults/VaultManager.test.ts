import type { NodeId, NodeAddress, NodeInfo } from '@/nodes/types';
import { ProviderId, IdentityId, IdentityInfo } from '@/identities/types';
import type { Host, Port, TLSConfig } from '@/network/types';
import type { KeyPairPem, CertificatePem } from '@/keys/types';

import os from 'os';
import path from 'path';
import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';

import { KeyManager } from '@/keys';
import { NodeManager } from '@/nodes';
import { VaultManager } from '@/vaults';
import { ACL } from '@/acl';
import { GestaltGraph } from '@/gestalts';
import { DB } from '@/db';
import { ForwardProxy, ReverseProxy } from '@/network';
import GRPCServer from '@/grpc/GRPCServer';
import { AgentService, createAgentService } from '@/agent';

import { errors as vaultErrors } from '@/vaults';
import * as keysUtils from '@/keys/utils';
import { utils as networkUtils } from '@/network';
import { errors as gitErrors } from '@/git';
import { resolvesZeroIP } from '@/network/utils';

describe('VaultManager is', () => {
  const logger = new Logger('VaultManager Test', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  let dataDir: string;
  let keyManager: KeyManager;
  let db: DB;
  let acl: ACL;
  let gestaltGraph: GestaltGraph;
  let nodeManager: NodeManager;
  let vaultManager: VaultManager;

  const sourceHost = '127.0.0.1' as Host;
  const sourcePort = 11112 as Port;
  const targetHost = '127.0.0.2' as Host;
  const targetPort = 11113 as Port;

  const fwdProxy = new ForwardProxy({
    authToken: 'abc',
    logger: logger,
  });
  const revProxy = new ReverseProxy({
    logger: logger,
  });

  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const keysPath = path.join(dataDir, 'keys');
    const dbPath = path.join(dataDir, 'db');
    const vaultsPath = path.join(dataDir, 'vaults');
    const nodesPath = path.join(dataDir, 'nodes');

    keyManager = new KeyManager({
      keysPath: keysPath,
      logger: logger
    });
    await keyManager.start({
      password: 'password'
    });

    await fwdProxy.start({
      tlsConfig: {
        keyPrivatePem: keyManager.getRootKeyPairPem().privateKey,
        certChainPem: await keyManager.getRootCertChainPem(),
      },
      egressHost: sourceHost,
      egressPort: sourcePort,
    });

    nodeManager = new NodeManager({
      nodesPath: nodesPath,
      keyManager: keyManager,
      fwdProxy: fwdProxy,
      revProxy: revProxy,
      fs: fs,
      logger: logger,
    });
    await nodeManager.start({
      nodeId: 'abc' as NodeId
    });

    db = new DB({
      dbPath: dbPath,
      logger: logger
    });
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
      vaultsPath: vaultsPath,
      keyManager: keyManager,
      nodeManager: nodeManager,
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
    await nodeManager.stop();
    await keyManager.stop();
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });

  afterAll(async () => {
    await fwdProxy.stop();
  })
  test('type correct', () => {
    expect(vaultManager).toBeInstanceOf(VaultManager);
  });
  test('starting and stopping', async () => {
    await vaultManager.start({ fresh: true });
    expect(vaultManager.started).toBe(true);
    await expect(fs.promises.readdir(dataDir)).resolves.toContain('vaults')
    await vaultManager.stop();
  });
  test('able to create a vault', async () => {
    await vaultManager.start({});
    const vault = await vaultManager.createVault('MyTestVault');
    expect(vault).toBeTruthy();
    await expect(fs.promises.readdir(path.join(dataDir, 'vaults'))).resolves.toContain(vault.vaultId);
    await vaultManager.stop();
  });
  test('able to create and get a vault', async () => {
    await vaultManager.start({});
    const vault = await vaultManager.createVault('MyTestVault');
    const theVault = await vaultManager.getVault(vault.vaultId);

    expect(vault).toBe(theVault);
    await expect(vaultManager.getVault('DoesNotExist')).rejects.toThrow(
      vaultErrors.ErrorVaultUndefined,
    );

    await vaultManager.stop();
  });
  test('able to rename a vault', async () => {
    await vaultManager.start({});
    const vault = await vaultManager.createVault('TestVault');
    const result = await vaultManager.renameVault(
      vault.vaultId,
      'BetterVault',
    );
    expect(result).toBe(true);
    await expect(vaultManager.getVault(vault.vaultId)).resolves.toBe(vault);
    await expect(vaultManager.renameVault('DoesNotExist', 'DNE')).rejects.toThrow(
      vaultErrors.ErrorVaultUndefined,
    );
    await vaultManager.stop();
  });
  test('able to delete a vault', async () => {
    await vaultManager.start({});
    const firstVault = await vaultManager.createVault('MyFirstVault');
    const secondVault = await vaultManager.createVault('MySecondVault');
    const thirdVault = await vaultManager.createVault('MyThirdVault');
    const result = await vaultManager.deleteVault(secondVault.vaultId);
    expect(result).toBe(true);
    await expect(vaultManager.getVault(firstVault.vaultId)).resolves.toBe(firstVault);
    await expect(vaultManager.getVault(secondVault.vaultId)).rejects.toThrow(`${secondVault.vaultId} does not exist`);
    await expect(vaultManager.getVault(thirdVault.vaultId)).resolves.toBe(thirdVault);
    await vaultManager.stop();
  });
  test('able to list vaults', async () => {
    await vaultManager.start({});
    await vaultManager.createVault('MyTestVault');
    await vaultManager.createVault('MyOtherTestVault');
    const vn: Array<string> = [];
    vaultManager.listVaults().forEach((a) => vn.push(a.name));
    expect(vn.sort()).toEqual(['MyTestVault', 'MyOtherTestVault'].sort());
    await vaultManager.stop();
  });
  test('able to get vault stats', async () => {
    await vaultManager.start({});
    const vault1 = await vaultManager.createVault('MyTestVault');
    const vault2 = await vaultManager.createVault('MyOtherTestVault');
    const stat1 = await vaultManager.vaultStats(vault1.vaultId);
    const stat2 = await vaultManager.vaultStats(vault2.vaultId);
    expect(stat1).toBeInstanceOf(fs.Stats);
    expect(stat2).toBeInstanceOf(fs.Stats);
    expect(stat1.ctime < stat2.ctime).toBeTruthy();
    await vaultManager.stop();
  });
  test('able to update the default node repo to pull from', async () => {
    await vaultManager.start({});
    const vault1 = await vaultManager.createVault('MyTestVault');
    const vault2 = await vaultManager.createVault('MyOtherTestVault');
    const noNode = await vaultManager.getDefaultNode(vault1.vaultId);
    expect(noNode).toBeUndefined();
    await vaultManager.setDefaultNode(vault1.vaultId, 'abc');
    const node = await vaultManager.getDefaultNode(vault1.vaultId);
    const noNode2 = await vaultManager.getDefaultNode(vault2.vaultId);
    expect(node).toBe('abc');
    expect(noNode2).toBeUndefined();
    await vaultManager.stop();
  });
  test('checking gestalt permissions for vaults', async () => {
    const node1: NodeInfo = {
      id: '123' as NodeId,
      links: { nodes: {}, identities: {} },
    };
    const node2: NodeInfo = {
      id: '345' as NodeId,
      links: { nodes: {}, identities: {} },
    };
    const node3: NodeInfo = {
      id: '678' as NodeId,
      links: { nodes: {}, identities: {} },
    };
    const node4: NodeInfo = {
      id: '890' as NodeId,
      links: { nodes: {}, identities: {} },
    };
    const id1: IdentityInfo = {
      providerId: 'github.com' as ProviderId,
      identityId: 'abc' as IdentityId,
      links: {
        nodes: {},
      },
    };
    const id2: IdentityInfo = {
      providerId: 'github.com' as ProviderId,
      identityId: 'def' as IdentityId,
      links: {
        nodes: {},
      },
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
    await vaultManager.setVaultPermissions('123', vault.vaultId);
    let record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeNull();
    expect(record['345']['pull']).toBeNull();
    expect(record['678']).toBeUndefined();
    expect(record['890']).toBeUndefined();

    await vaultManager.unsetVaultPermissions('345', vault.vaultId);
    record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeUndefined();
    expect(record['345']['pull']).toBeUndefined();

    await gestaltGraph.unlinkNodeAndNode(node1.id, node2.id);
    await vaultManager.setVaultPermissions('345', vault.vaultId);
    record = await vaultManager.getVaultPermissions(vault.vaultId);
    expect(record).not.toBeUndefined();
    expect(record['123']['pull']).toBeUndefined();
    expect(record['345']['pull']).toBeNull();

    await vaultManager.stop();
  });
  test('able to create many vaults', async () => {
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
  test('able to read and load existing metadata', async () => {
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
    expect(vaultId).not.toBeUndefined();
    const vault = await vaultManager.getVault(vaultId);
    expect(vault).toBeTruthy();
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
    const vn: Array<string> = [];
    vaultManager.listVaults().forEach((a) => vn.push(a.name));
    expect(vn.sort()).toEqual(vaultNames.sort());
    await vaultManager.stop();
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
    await vaultManager.start({});
    for (const vaultName of vaultNames) {
      await vaultManager.createVault(vaultName);
    }
    const v10 = await vaultManager.getVaultId('Vault10');
    expect(v10).toBeTruthy();
    await vaultManager.deleteVault(v10!);
    const v5 = await vaultManager.getVaultId('Vault5');
    expect(v5).toBeTruthy();
    await vaultManager.deleteVault(v5!);
    const v9 = await vaultManager.getVaultId('Vault9');
    expect(v9).toBeTruthy();
    const vault9 = await vaultManager.getVault(v9!);
    await vaultManager.renameVault(v9!, 'Vault10');
    await vaultManager.createVault('ThirdImpact');
    await vaultManager.createVault('Cake');
    await vault9.addSecret('MySecret', 'MyActualPassword');
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
    const v102 = await vaultManager.getVaultId('Vault10');
    expect(v102).toBeTruthy();
    const secret = await (await vaultManager.getVault(v102!)).getSecret('MySecret');
    expect(secret.toString()).toBe('MyActualPassword');
    alteredVaultNames.push('Pumpkin');
    expect(vaultManager.listVaults().length).toEqual(alteredVaultNames.length);
    await vaultManager.stop();
  });
  /* TESTING TODO:
   *  Changing the default node to pull from
   */
  describe('interacting with another node to', () => {
    let targetDataDir: string;
    let targetKeyManager: KeyManager;
    let targetFwdProxy: ForwardProxy;
    let targetDb: DB;
    let targetACL: ACL;
    let targetGestaltGraph: GestaltGraph;
    let targetNodeManager: NodeManager;
    let targetVaultManager: VaultManager;

    let targetNodeId: NodeId;
    let targetKeyPairPem: KeyPairPem;
    let targetCertPem: CertificatePem;
    let revTLSConfig: TLSConfig;

    let agentService;
    let server: GRPCServer;

    let node: NodeInfo;

    beforeEach(async () => {
      node = {
        id: nodeManager.getNodeId(),
        links: { nodes: {}, identities: {} },
      };
      const targetKeyPair = await keysUtils.generateKeyPair(4096);
      targetKeyPairPem = keysUtils.keyPairToPem(targetKeyPair);
      const targetCert = keysUtils.generateCertificate(
        targetKeyPair.publicKey,
        targetKeyPair.privateKey,
        targetKeyPair.privateKey,
        12332432423,
      );

      targetCertPem = keysUtils.certToPem(targetCert);
      targetNodeId = networkUtils.certNodeId(targetCert);
      revTLSConfig = {
        keyPrivatePem: targetKeyPairPem.privateKey,
        certChainPem: targetCertPem,
      };
      targetDataDir = await fs.promises.mkdtemp(
        path.join(os.tmpdir(), 'polykey-test-'),
      );
      targetKeyManager = new KeyManager({
        keysPath: path.join(targetDataDir, 'keys'),
        fs: fs,
        logger: logger,
      });
      await targetKeyManager.start({ password: 'password' });
      targetFwdProxy = new ForwardProxy({
        authToken: '',
        logger: logger,
      });
      targetNodeManager = new NodeManager({
        nodesPath: path.join(targetDataDir, 'nodes'),
        keyManager: targetKeyManager,
        fwdProxy: targetFwdProxy,
        revProxy: revProxy,
        fs: fs,
        logger: logger,
      });
      await targetNodeManager.start({ nodeId: targetNodeId });
      targetDb = new DB({
        dbPath: path.join(targetDataDir, 'db'),
        logger: logger,
      });
      await targetDb.start({ keyPair: keyManager.getRootKeyPair() });
      targetACL = new ACL({
        db: targetDb,
        logger: logger,
      });
      await targetACL.start();
      targetGestaltGraph = new GestaltGraph({
        db: targetDb,
        acl: targetACL,
        logger: logger,
      });
      await targetGestaltGraph.start();
      await targetGestaltGraph.setNode(node);
      targetVaultManager = new VaultManager({
        vaultsPath: path.join(targetDataDir, 'vaults'),
        keyManager: targetKeyManager,
        nodeManager: targetNodeManager,
        db: targetDb,
        acl: targetACL,
        gestaltGraph: targetGestaltGraph,
        logger: logger,
      });
      await targetVaultManager.start({});
      agentService = createAgentService({
        vaultManager: targetVaultManager,
        nodeManager: targetNodeManager,
      });
      server = new GRPCServer({
        services: [[AgentService, agentService]],
        logger: logger,
      });
      await server.start({
        host: targetHost,
      });

      await revProxy.start({
        ingressHost: targetHost,
        ingressPort: targetPort,
        serverHost: targetHost,
        serverPort: server.getPort(),
        tlsConfig: revTLSConfig,
      });
    });

    afterEach(async () => {
      await revProxy.closeConnection(
        fwdProxy.getEgressHost(),
        fwdProxy.getEgressPort(),
      );
      await fwdProxy.closeConnection(
        fwdProxy.getEgressHost(),
        fwdProxy.getEgressPort(),
      );
      await revProxy.stop();
      await server.stop();
      await targetVaultManager.stop();
      await targetGestaltGraph.stop();
      await targetACL.stop();
      await targetDb.stop();
      await targetNodeManager.stop();
      await targetKeyManager.stop();
      await targetFwdProxy.stop();
      await fs.promises.rm(targetDataDir, {
        force: true,
        recursive: true,
      });
    });
    test('clone and pull vaults', async () => {
      await vaultManager.start({});
      const vault = await targetVaultManager.createVault('MyFirstVault');
      await targetVaultManager.setVaultPermissions(
        nodeManager.getNodeId(),
        vault.vaultId,
      );
      await vault.addSecret('MyFirstSecret', 'Success?');
      await nodeManager.setNode(targetNodeId, {
        ip: targetHost,
        port: targetPort,
      } as NodeAddress);
      await nodeManager.createConnectionToNode(targetNodeId, {
        ip: targetHost,
        port: targetPort,
      } as NodeAddress);
      await revProxy.openConnection(sourceHost, sourcePort);
      await vaultManager.cloneVault(vault.vaultId, targetNodeId);
      await expect(vaultManager.getDefaultNode(vault.vaultId)).resolves.toBe(targetNodeId);
      const vaultsList = vaultManager.listVaults();
      expect(vaultsList[0].name).toStrictEqual('MyFirstVault');
      const clonedVault = await vaultManager.getVault(vaultsList[0].id);
      expect(await clonedVault.getSecret('MyFirstSecret')).toStrictEqual(
        'Success?',
      );
      vault.addSecret('MySecondSecret', 'SecondSuccess?');
      await vaultManager.pullVault(vault.vaultId, targetNodeId);
      expect((await clonedVault.listSecrets()).sort()).toStrictEqual(
        ['MyFirstSecret', 'MySecondSecret'].sort(),
      );
      expect(await clonedVault.getSecret('MySecondSecret')).toStrictEqual(
        'SecondSuccess?',
      );
    });
    test('reject clone and pull ops when permissions are not set', async () => {
      await vaultManager.start({});
      const vault = await targetVaultManager.createVault('MyFirstVault');
      await vault.addSecret('MyFirstSecret', 'Success?');
      await nodeManager.setNode(targetNodeId, {
        ip: targetHost,
        port: targetPort,
      } as NodeAddress);
      await nodeManager.createConnectionToNode(targetNodeId, {
        ip: targetHost,
        port: targetPort,
      } as NodeAddress);
      await revProxy.openConnection(sourceHost, sourcePort);
      await expect(
        vaultManager.cloneVault(vault.vaultId, targetNodeId),
      ).rejects.toThrow(gitErrors.ErrorGitPermissionDenied);
      const vaultsList = vaultManager.listVaults();
      expect(vaultsList).toStrictEqual([]);
      await targetVaultManager.setVaultPermissions(
        nodeManager.getNodeId(),
        vault.vaultId,
      );
      await vaultManager.cloneVault(vault.vaultId, targetNodeId);
      await targetVaultManager.unsetVaultPermissions(
        nodeManager.getNodeId(),
        vault.vaultId,
      );
      vault.addSecret('MySecondSecret', 'SecondSuccess?');
      await expect(
        vaultManager.pullVault(vault.vaultId, targetNodeId),
      ).rejects.toThrow(gitErrors.ErrorGitPermissionDenied);
      const list = vaultManager.listVaults();
      const clonedVault = await vaultManager.getVault(list[0].id);
      expect((await clonedVault.listSecrets()).sort()).toStrictEqual(
        ['MyFirstSecret'].sort(),
      );
      await vaultManager.stop();
    });
  });
});
