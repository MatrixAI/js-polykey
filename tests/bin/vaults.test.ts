import type { NodeId, NodeInfo } from '@/nodes/types';

import os from 'os';
import path from 'path';
import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { PolykeyAgent } from '@';
import { NodeAddress } from '@/nodes/types';
import * as utils from './utils';

const logger = new Logger('CLI Test', LogLevel.WARN, [new StreamHandler()]);
let dataDir: string;
let passwordFile: string;
let polykeyAgent: PolykeyAgent;
const jwtTokenExitCode = 77;
const node1: NodeInfo = {
  id: '123' as NodeId,
  chain: {},
};
const node2: NodeInfo = {
  id: '456' as NodeId,
  chain: {},
};
const node3: NodeInfo = {
  id: '789' as NodeId,
  chain: {},
};

describe('CLI vaults', () => {
  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    passwordFile = path.join(dataDir, 'passwordFile');
    await fs.promises.writeFile(passwordFile, 'password');
    polykeyAgent = new PolykeyAgent({
      nodePath: dataDir,
      logger: logger,
    });
    await polykeyAgent.start({
      password: 'password',
    });
    await polykeyAgent.gestalts.setNode(node1);
    await polykeyAgent.gestalts.setNode(node2);
    await polykeyAgent.gestalts.setNode(node3);

    // Authorize session
    await utils.pk([
      'agent',
      'unlock',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
    ]);
  });

  afterEach(async () => {
    await polykeyAgent.stop();
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });

  test('should list vaults', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    await polykeyAgent.vaults.createVault('Vault2');

    const result = await utils.pk([
      'vaults',
      'list',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);
  });
  test('should create vaults', async () => {
    const result = await utils.pk([
      'vaults',
      'create',
      '-np',
      dataDir,
      '-vn',
      'MyTestVault',
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);
    const result2 = await utils.pk([
      'vaults',
      'touch',
      '-np',
      dataDir,
      '-vn',
      'MyTestVault2',
    ]);
    expect(result2).toBe(0);

    const vaults = polykeyAgent.vaults.listVaults().sort();
    expect(vaults[0].name).toBe('MyTestVault');
    expect(vaults[1].name).toBe('MyTestVault2');
  });
  test('should prompt the user to enter their password', async () => {
    const result = await utils.pk([
      'vaults',
      'create',
      '-np',
      dataDir,
      '-vn',
      'MyTestVault',
    ]);
    expect(result).toBe(0);
  });
  test('should rename vault', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    const result = await utils.pk([
      'vaults',
      'rename',
      '-vn',
      'Vault1',
      '-nn',
      'RenamedVault',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);

    const list = polykeyAgent.vaults.listVaults();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('RenamedVault');
  });
  test('should fail to rename non-existent vault', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    const result = await utils.pk([
      'vaults',
      'rename',
      '-vn',
      'InvalidVaultId', // vault does not exist
      '-nn',
      'RenamedVault',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
    ]);
    // Exit code of the exception
    expect(result).toBe(10);
    const list = polykeyAgent.vaults.listVaults();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Vault1');
  });
  test('should delete vault', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    let id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    const result2 = await utils.pk([
      'vaults',
      'delete',
      '-np',
      dataDir,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result2).toBe(0);

    const list = polykeyAgent.vaults.listVaults();
    expect(list.length).toBe(0);
  });
  test('should return the stats of a vault', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    const result = await utils.pk([
      'vaults',
      'stat',
      '-np',
      dataDir,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);
  });
  test('should share a vault', async () => {
    await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    const result = await utils.pk([
      'vaults',
      'share',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
      'Vault1',
      node1.id,
      node2.id,
    ]);
    expect(result).toBe(0);
    const sharedNodes = await polykeyAgent.vaults.getVaultPermissions(
      id!,
      undefined,
    );
    const sharedNodesString = JSON.stringify(sharedNodes);
    expect(sharedNodesString).toContain(node1.id);
    expect(sharedNodesString).toContain(node2.id);
    expect(sharedNodesString).not.toContain(node3.id);
  });
  test('should unshare a vault', async () => {
    //creating vault.
    await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    //init sharing.
    await polykeyAgent.vaults.setVaultPerm(node1.id, id!);
    await polykeyAgent.vaults.setVaultPerm(node2.id, id!);
    await polykeyAgent.vaults.setVaultPerm(node3.id, id!);

    const result = await utils.pk([
      'vaults',
      'unshare',
      '-np',
      dataDir,
      '--password-file',
      passwordFile,
      'Vault1',
      node1.id,
      node2.id,
      node3.id,
    ]);
    expect(result).toBe(0);
    const sharedNodes = await polykeyAgent.vaults.getVaultPermissions(
      id!,
      undefined,
    );
    const sharedNodesString = JSON.stringify(sharedNodes);
    expect(sharedNodesString).not.toContain('pull');
  });
  test('should get permissions of a vault', async () => {
    const vault = await polykeyAgent.vaults.createVault('Vault1');
    const id = polykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();
    await polykeyAgent.vaults.setVaultPerm('123', vault.vaultId);
    await polykeyAgent.vaults.setVaultPerm('456', vault.vaultId);
    await polykeyAgent.vaults.setVaultPerm('789', vault.vaultId);

    await polykeyAgent.vaults.unsetVaultPerm('456', vault.vaultId);

    const result = await utils.pk([
      'vaults',
      'perms',
      '-np',
      dataDir,
      'vault1',
    ]);
    expect(result).toBe(0);
  });
  test('should clone a vault', async () => {
    const dataDir2 = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const targetPolykeyAgent = new PolykeyAgent({
      nodePath: dataDir2,
      logger: logger,
    });
    await targetPolykeyAgent.start({
      password: 'password',
    });
    const vault = await targetPolykeyAgent.vaults.createVault('Vault1');
    await vault.initializeVault();
    const id = targetPolykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    await targetPolykeyAgent.gestalts.setNode({
      id: polykeyAgent.nodes.getNodeId(),
      chain: {},
    });
    await targetPolykeyAgent.vaults.setVaultPerm(
      polykeyAgent.nodes.getNodeId(),
      vault.vaultId,
    );

    const targetNodeId = targetPolykeyAgent.nodes.getNodeId();
    const targetHost = targetPolykeyAgent.revProxy.getIngressHost();
    const targetPort = targetPolykeyAgent.revProxy.getIngressPort();
    await polykeyAgent.nodes.setNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    });
    // Client agent: Start sending hole-punching packets to the target
    await polykeyAgent.nodes.createConnectionToNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    } as NodeAddress);
    const clientEgressHost = polykeyAgent.fwdProxy.getEgressHost();
    const clientEgressPort = polykeyAgent.fwdProxy.getEgressPort();
    // Server agent: start sending hole-punching packets back to the 'client'
    // agent (in order to establish a connection)
    await targetPolykeyAgent.nodes.openConnection(
      clientEgressHost,
      clientEgressPort,
    );

    // Vault does not exist on the source PolykeyAgent so the pull command throws an error which
    // caught, the error is checked and if it is ErrorVaultUndefined, then the Agent attempts a
    // clone instead
    const result = await utils.pk([
      'vaults',
      'pull',
      '-np',
      dataDir,
      '-ni',
      targetNodeId as string,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);

    await targetPolykeyAgent.stop();
    await fs.promises.rm(dataDir2, {
      force: true,
      recursive: true,
    });

    const list = polykeyAgent.vaults.listVaults();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Vault1');
  }, 20000);
  test('should pull a vault', async () => {
    const dataDir2 = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const targetPolykeyAgent = new PolykeyAgent({
      nodePath: dataDir2,
      logger: logger,
    });
    await targetPolykeyAgent.start({
      password: 'password',
    });
    const vault = await targetPolykeyAgent.vaults.createVault('Vault1');
    await vault.initializeVault();
    const id = targetPolykeyAgent.vaults.getVaultId('Vault1');
    expect(id).toBeTruthy();

    await targetPolykeyAgent.gestalts.setNode({
      id: polykeyAgent.nodes.getNodeId(),
      chain: {},
    });
    await targetPolykeyAgent.vaults.setVaultPerm(
      polykeyAgent.nodes.getNodeId(),
      vault.vaultId,
    );

    const targetNodeId = targetPolykeyAgent.nodes.getNodeId();
    const targetHost = targetPolykeyAgent.revProxy.getIngressHost();
    const targetPort = targetPolykeyAgent.revProxy.getIngressPort();
    await polykeyAgent.nodes.setNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    });
    // Client agent: Start sending hole-punching packets to the target
    await polykeyAgent.nodes.createConnectionToNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    } as NodeAddress);
    const clientEgressHost = polykeyAgent.fwdProxy.getEgressHost();
    const clientEgressPort = polykeyAgent.fwdProxy.getEgressPort();
    // Server agent: start sending hole-punching packets back to the 'client'
    // agent (in order to establish a connection)
    await targetPolykeyAgent.nodes.openConnection(
      clientEgressHost,
      clientEgressPort,
    );

    // Vault does not exist on the source PolykeyAgent so the pull command throws an error which
    // caught, the error is checked and if it is ErrorVaultUndefined, then the Agent attempts a
    // clone instead
    const result = await utils.pk([
      'vaults',
      'pull',
      '-np',
      dataDir,
      '-ni',
      targetNodeId as string,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);

    await vault.addSecret(
      'MySecret',
      Buffer.from('This secret will be pulled'),
    );

    const list = polykeyAgent.vaults.listVaults();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Vault1');
    const clonedVault = polykeyAgent.vaults.getVault(list[0].id);
    await expect(clonedVault.listSecrets()).resolves.toStrictEqual([]);

    const result3 = await utils.pk([
      'vaults',
      'pull',
      '-np',
      dataDir,
      '-ni',
      targetNodeId as string,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result3).toBe(0);

    await expect(clonedVault.listSecrets()).resolves.toStrictEqual([
      'MySecret',
    ]);
    await expect(clonedVault.getSecret('MySecret')).resolves.toStrictEqual(
      Buffer.from('This secret will be pulled'),
    );

    await targetPolykeyAgent.stop();
    await fs.promises.rm(dataDir2, {
      force: true,
      recursive: true,
    });
  }, 20000);
  test('should scan a node for vaults', async () => {
    const dataDir2 = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const targetPolykeyAgent = new PolykeyAgent({
      nodePath: dataDir2,
      logger: logger,
    });
    await targetPolykeyAgent.start({
      password: 'password',
    });

    const targetNodeId = targetPolykeyAgent.nodes.getNodeId();
    const targetHost = targetPolykeyAgent.revProxy.getIngressHost();
    const targetPort = targetPolykeyAgent.revProxy.getIngressPort();
    await polykeyAgent.nodes.setNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    });
    // Client agent: Start sending hole-punching packets to the target
    await polykeyAgent.nodes.createConnectionToNode(targetNodeId, {
      ip: targetHost,
      port: targetPort,
    } as NodeAddress);
    const clientEgressHost = polykeyAgent.fwdProxy.getEgressHost();
    const clientEgressPort = polykeyAgent.fwdProxy.getEgressPort();
    // Server agent: start sending hole-punching packets back to the 'client'
    // agent (in order to establish a connection)
    await targetPolykeyAgent.nodes.openConnection(
      clientEgressHost,
      clientEgressPort,
    );

    await targetPolykeyAgent.vaults.createVault('Vault1');
    await targetPolykeyAgent.vaults.createVault('Vault2');
    await targetPolykeyAgent.vaults.createVault('Vault3');

    const targetVaults = targetPolykeyAgent.vaults.listVaults();
    expect(targetVaults.length).toBe(3);

    const result = await utils.pk([
      'vaults',
      'scan',
      '-np',
      dataDir,
      '-ni',
      targetNodeId as string,
      '--password-file',
      passwordFile,
    ]);
    expect(result).toBe(0);

    await targetPolykeyAgent.stop();
    await fs.promises.rmdir(dataDir2, { recursive: true });
  });
});

describe('CLI vaults no token', () => {
  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    passwordFile = path.join(dataDir, 'passwordFile');
    await fs.promises.writeFile(passwordFile, 'password');
    polykeyAgent = new PolykeyAgent({
      nodePath: dataDir,
      logger: logger,
    });
    await polykeyAgent.start({
      password: 'password',
    });
    await polykeyAgent.gestalts.setNode(node1);
    await polykeyAgent.gestalts.setNode(node2);
    await polykeyAgent.gestalts.setNode(node3);
  });

  afterEach(async () => {
    await polykeyAgent.stop();
    await fs.promises.rmdir(dataDir, { recursive: true });
  });

  test('does not list vaults without token', async () => {
    const result = await utils.pk(['vaults', 'list', '-np', dataDir]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not create vaults without token', async () => {
    const result = await utils.pk([
      'vaults',
      'create',
      '-np',
      dataDir,
      '-vn',
      'MyTestVault',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not rename vaults without token', async () => {
    const result = await utils.pk([
      'vaults',
      'rename',
      '-vn',
      'Vault1',
      '-nn',
      'RenamedVault',
      '-np',
      dataDir,
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not delete a vault without token', async () => {
    const result2 = await utils.pk([
      'vaults',
      'delete',
      '-np',
      dataDir,
      '-vn',
      'Vault1',
      '--password-file',
      passwordFile,
    ]);
    expect(result2).toBe(jwtTokenExitCode);
  });
  test('does not return stats of a vault without token', async () => {
    const result = await utils.pk([
      'vaults',
      'stat',
      '-np',
      dataDir,
      '-vn',
      'Vault1',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not share a vault without token', async () => {
    const result = await utils.pk([
      'vaults',
      'share',
      '-np',
      dataDir,
      'Vault1',
      '123',
      '345',
      '135',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not get permissions of a vault without token', async () => {
    const result = await utils.pk([
      'vaults',
      'perms',
      '-np',
      dataDir,
      'Vault1',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not clone a vault / pull a vault without token', async () => {
    const result = await utils.pk([
      'vaults',
      'pull',
      '-np',
      dataDir,
      '-ni',
      '<NodeId>',
      '-vn',
      'Vault1',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not scan a node without token', async () => {
    const result = await utils.pk([
      'vaults',
      'scan',
      '-np',
      dataDir,
      '-ni',
      '<NodeId>',
    ]);
    expect(result).toBe(jwtTokenExitCode);
  });
  test('does not get permissions of vault without token', async () => {
    const result2 = await utils.pk([
      'vaults',
      'permissions',
      '-np',
      dataDir,
      'Vault1',
    ]);
    expect(result2).toBe(jwtTokenExitCode);
  });
});
