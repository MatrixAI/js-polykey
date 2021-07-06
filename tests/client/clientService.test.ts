import type { Vault } from '@/vaults';
import type { SessionToken } from '@/session/types';
import type { NodeId, NodeInfo } from '@/nodes/types';
import type { IdentityId, IdentityInfo, ProviderId } from '@/identities/types';

import os from 'os';
import path from 'path';
import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';

import * as grpc from '@grpc/grpc-js';

import { clientPB } from '@/client';
import { NodeManager } from '@/nodes';
import { GestaltGraph } from '@/gestalts';
import { VaultManager } from '@/vaults';
import { IdentitiesManager } from '@/identities';
import { Sigchain } from '@/sigchain';
import { ACL } from '@/acl';
import { GitManager } from '@/git';
import { KeyManager, utils as keyUtils } from '@/keys';
import { ClientClient } from '@/proto/js/Client_grpc_pb';
import { ForwardProxy, ReverseProxy, utils as networkUtils } from '@/network';
import { DB } from '@/db';
import { PolykeyAgent } from '@';

import * as utils from '@/utils';
import * as testUtils from './utils';
import * as grpcUtils from '@/grpc/utils';
import * as gestaltsUtils from '@/gestalts/utils';
import * as polykeyErrors from '@/errors';
import * as vaultErrors from '@/vaults/errors';
import { GithubProvider } from '../../src/identities/providers';
import TestProvider from '../identities/TestProvider';
import { ErrorNodeGraphEmptyShortlist } from "@/errors";

describe('Client service', () => {
  const logger = new Logger('ClientServerTest', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  let client: ClientClient;
  let server: grpc.Server;
  let port: number;

  let dataDir: string;
  let keysPath: string;
  let nodesPath: string;
  let vaultsPath: string;
  let identitiesPath: string;
  let dbPath: string;

  let polykeyAgent: PolykeyAgent;
  let keyManager: KeyManager;
  let gitManager: GitManager;
  let nodeManager: NodeManager;
  let vaultManager: VaultManager;
  let gestaltGraph: GestaltGraph;
  let identitiesManager: IdentitiesManager;
  let sigchain: Sigchain;
  let acl: ACL;
  let db: DB;

  let passwordFile: string;

  let fwdProxy: ForwardProxy;
  let revProxy: ReverseProxy;

  let nodeId: NodeId;

  let callCredentials: Partial<grpc.CallOptions>;

  //node and identity infos.
  let token;
  let testToken;
  let node1: NodeInfo;
  let node2: NodeInfo;
  let identity1: IdentityInfo;

  async function createGestaltState() {
    await gestaltGraph.setNode(node1);
    await gestaltGraph.setNode(node2);
    await gestaltGraph.setIdentity(identity1);
    await gestaltGraph.linkNodeAndIdentity(node2, identity1);
  }

  beforeAll(async () => {
    const keyPair = await keyUtils.generateKeyPair(4096);
    const cert = keyUtils.generateCertificate(
      keyPair.publicKey,
      keyPair.privateKey,
      keyPair.privateKey,
      86400,
    );
    nodeId = networkUtils.certNodeId(cert);

    //Filling in infos.
    token = {
      providerId: 'github.com' as ProviderId,
      identityId: 'tegefaulkes' as IdentityId,
      tokenData: {
        accessToken: 'Oauth token here, DO NOT COMMIT.',
      },
    };
    testToken = {
      providerId: 'test-provider' as ProviderId,
      identityId: 'test_user' as IdentityId,
      tokenData: {
        accessToken: 'abc123',
      },
    };

    node2= {
      id: 'NodeIdABC' as NodeId,
      chain: {},
    };
    node1= {
      id: nodeId,
      chain: {},
    };
    identity1 = {
      providerId: 'github.com' as ProviderId,
      identityId: 'IdentityIdABC' as IdentityId,
      claims: {},
    };
  });

  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    keysPath = path.join(dataDir, 'keys');
    nodesPath = path.join(dataDir, 'nodes');
    vaultsPath = path.join(dataDir, 'vaults');
    identitiesPath = path.join(dataDir, 'identities');
    dbPath = path.join(dataDir, 'db');

    passwordFile = path.join(dataDir, 'password');
    await fs.promises.writeFile(passwordFile, 'password');

    fwdProxy = new ForwardProxy({
      authToken: 'abc',
      logger: logger,
    });

    revProxy = new ReverseProxy({
      logger: logger,
    });

    keyManager = new KeyManager({
      keysPath,
      fs: fs,
      logger: logger,
    });

    db = new DB({
      dbPath: dbPath,
      fs: fs,
      logger: logger,
    });

    acl = new ACL({
      db: db,
      logger: logger,
    });

    sigchain = new Sigchain({
      keyManager: keyManager,
      db: db,
      logger: logger,
    });

    gestaltGraph = new GestaltGraph({
      db: db,
      acl: acl,
      logger: logger,
    });

    vaultManager = new VaultManager({
      vaultsPath: vaultsPath,
      keyManager: keyManager,
      db: db,
      acl: acl,
      gestaltGraph: gestaltGraph,
      fs: fs,
      logger: logger,
    });

    nodeManager = new NodeManager({
      db: db,
      sigchain: sigchain,
      keyManager: keyManager,
      fwdProxy: fwdProxy,
      revProxy: revProxy,
      fs: fs,
      logger: logger,
    });

    identitiesManager = new IdentitiesManager({
      db: db,
      logger: logger,
    });

    gitManager = new GitManager({
      vaultManager: vaultManager,
      nodeManager: nodeManager,
    });

    polykeyAgent = new PolykeyAgent({
      nodePath: dataDir,
      keyManager: keyManager,
      vaultManager: vaultManager,
      nodeManager: nodeManager,
      gestaltGraph: gestaltGraph,
      identitiesManager: identitiesManager,
      acl: acl,
      db: db,
      gitManager: gitManager,
      fwdProxy: fwdProxy,
      revProxy: revProxy,
      fs: fs,
      logger: logger,
    });

    await polykeyAgent.keys.start({ password: 'password' });
    await polykeyAgent.db.start({ keyPair: keyManager.getRootKeyPair() });
    await polykeyAgent.acl.start();
    await polykeyAgent.sigchain.start();
    await polykeyAgent.vaults.start({});
    await polykeyAgent.nodes.start({ nodeId: nodeId });
    await polykeyAgent.identities.start();
    await polykeyAgent.gestalts.start();
    await polykeyAgent.gitManager.start();
    await polykeyAgent.sessions.start({ bits: 4069 });

    //adding provider.
    const githubProvider = new GithubProvider({ clientId: 'abc', logger });
    identitiesManager.registerProvider(githubProvider);
    const testProvider = new TestProvider();
    identitiesManager.registerProvider(testProvider);

    [server, port] = await testUtils.openTestClientServer({
      polykeyAgent,
    });

    client = await testUtils.openSimpleClientClient(port);

    const token = await polykeyAgent.sessions.generateJWTToken();
    callCredentials = {
      credentials: grpc.CallCredentials.createFromMetadataGenerator(
        (_params, callback) => {
          const meta = new grpc.Metadata();
          meta.add('Authorization', `Bearer: ${token}`);
          callback(null, meta);
        },
      ),
    };
  });

  afterEach(async () => {
    await testUtils.closeTestClientServer(server);
    testUtils.closeSimpleClientClient(client);

    await polykeyAgent.sessions.stop();
    await polykeyAgent.gitManager.stop();
    await polykeyAgent.gestalts.stop();
    await polykeyAgent.identities.stop();
    await polykeyAgent.nodes.stop();
    await polykeyAgent.vaults.stop();
    await polykeyAgent.sigchain.stop();
    await polykeyAgent.acl.stop();
    await polykeyAgent.db.stop();
    await polykeyAgent.keys.stop();

    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });

  afterAll(async () => {
    await fs.promises.rm(passwordFile);
  });

  test('can echo', async () => {
    const echo = grpcUtils.promisifyUnaryCall<clientPB.EchoMessage>(
      client,
      client.echo,
    );
    const m = new clientPB.EchoMessage();
    m.setChallenge('Hello');
    const res: clientPB.EchoMessage = await echo(m, callCredentials);
    expect(res.getChallenge()).toBe('Hello');

    // Hard Coded error
    m.setChallenge('ThrowAnError');
    await expect(echo(m)).rejects.toThrow(polykeyErrors.ErrorPolykey);
  });
  test('can request JWT', async () => {
    const requestJWT = grpcUtils.promisifyUnaryCall<clientPB.JWTTokenMessage>(
      client,
      client.sessionRequestJWT,
    );

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.EmptyMessage();

    const res = await requestJWT(m, meta);
    expect(typeof res.getToken()).toBe('string');
    const result = await polykeyAgent.sessions.verifyJWTToken(
      res.getToken() as SessionToken,
    );
    expect(result).toBeTruthy();
  });
  test('can get vaults', async () => {
    const listVaults =
      grpcUtils.promisifyReadableStreamCall<clientPB.VaultMessage>(
        client,
        client.vaultsList,
      );

    const vaultList = ['Vault1', 'Vault2', 'Vault3', 'Vault4', 'Vault5'];

    for (const vaultName of vaultList) {
      await vaultManager.createVault(vaultName);
    }

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.EmptyMessage();
    const res = listVaults(m, meta, callCredentials);
    const names: Array<string> = [];
    for await (const val of res) {
      names.push(val.getName());
    }

    expect(names.sort()).toStrictEqual(vaultList.sort());
  });
  test('can create vault', async () => {
    const createVault = grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      client,
      client.vaultsCreate,
    );

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.VaultMessage();
    m.setName('NewVault');

    const res = await createVault(m, meta, callCredentials);
    expect(res.getSuccess()).toBe(true);
    const name = vaultManager.listVaults().pop()?.name;
    expect(name).toBe('NewVault');
  });
  test('can delete vaults', async () => {
    const deleteVault = grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      client,
      client.vaultsDelete,
    );

    const vaultList = ['Vault1', 'Vault2', 'Vault3', 'Vault4', 'Vault5'];
    const vaultList2 = ['Vault2', 'Vault3', 'Vault4', 'Vault5'];

    const vaults: Array<Vault> = [];

    for (const vaultName of vaultList) {
      vaults.push(await vaultManager.createVault(vaultName));
    }

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.VaultMessage();
    m.setName(vaults[0].vaultId);

    const res = await deleteVault(m, meta, callCredentials);
    expect(res.getSuccess()).toBe(true);

    const list: Array<string> = [];
    const listVaults = vaultManager.listVaults().sort();
    for (const vault of listVaults) {
      list.push(vault.name);
    }
    expect(list).toStrictEqual(vaultList2.sort());

    await expect(deleteVault(m, meta, callCredentials)).rejects.toThrow(
      vaultErrors.ErrorVaultUndefined,
    );
  });
  test('can rename vaults', async () => {
    const renameVault = grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      client,
      client.vaultsRename,
    );

    const vault = await vaultManager.createVault('MyFirstVault');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.VaultMessage();
    m.setId(vault.vaultId);
    m.setName('MyRenamedVault');

    const res = await renameVault(m, meta, callCredentials);
    expect(res.getSuccess()).toBe(true);

    const name = vaultManager.listVaults().pop()?.name;
    expect(name).toBe('MyRenamedVault');
  });
  test('can get stats for vaults', async () => {
    const statsVault = grpcUtils.promisifyUnaryCall<clientPB.StatMessage>(
      client,
      client.vaultsStat,
    );

    const vault = await vaultManager.createVault('MyFirstVault');
    const vault2 = await vaultManager.createVault('MySecondVault');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.VaultMessage();
    m.setName(vault.vaultId);

    const res = await statsVault(m, meta, callCredentials);
    const stats1 = res.getStats();

    m.setName(vault2.vaultId);
    const res2 = await statsVault(m, meta, callCredentials);
    const stats2 = res2.getStats();

    expect(stats1).toBe(
      JSON.stringify(await vaultManager.vaultStats(vault.vaultId)),
    );
    expect(stats2).toBe(
      JSON.stringify(await vaultManager.vaultStats(vault2.vaultId)),
    );
  });
  test('can make a directory in a vault', async () => {
    const mkdirVault = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.vaultsMkdir,
    );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();
    const dirPath = 'dir/dir1/dir2';

    const m = new clientPB.VaultSpecificMessage();
    const mv = new clientPB.VaultMessage();
    mv.setName(vault.vaultName);
    m.setVault(mv);
    m.setName(dirPath);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    await mkdirVault(m, meta, callCredentials);

    expect(
      vault.EncryptedFS.existsSync(`${vault.vaultId}/${dirPath}`),
    ).toBeTruthy();
  });
  test('can list secrets in a vault', async () => {
    const listSecretsVault =
      grpcUtils.promisifyReadableStreamCall<clientPB.SecretMessage>(
        client,
        client.vaultsListSecrets,
      );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const secretList = ['Secret1', 'Secret2', 'Secret3', 'Secret4', 'Secret5'];

    for (const secretName of secretList) {
      await vault.addSecret(secretName, Buffer.from(secretName));
    }

    const m = new clientPB.VaultMessage();
    m.setName(vault.vaultName);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    const res = listSecretsVault(m, meta, callCredentials);

    const names: Array<string> = [];
    for await (const val of res) {
      names.push(val.getName());
    }

    expect(names.sort()).toStrictEqual(secretList.sort());
  });
  test('can delete secrets in a vault', async () => {
    const deleteSecretVault =
      grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
        client,
        client.vaultsDeleteSecret,
      );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const secretList = ['Secret1', 'Secret2', 'Secret3', 'Secret4', 'Secret5'];
    const secretList2 = ['Secret2', 'Secret3', 'Secret4', 'Secret5'];

    for (const secretName of secretList) {
      await vault.addSecret(secretName, Buffer.from(secretName));
    }

    const m = new clientPB.VaultSpecificMessage();
    const mv = new clientPB.VaultMessage();
    mv.setName(vault.vaultName);
    m.setVault(mv);
    m.setName('Secret1');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    const res = await deleteSecretVault(m, meta, callCredentials);
    expect(res.getSuccess()).toBeTruthy();

    expect((await vault.listSecrets()).sort()).toStrictEqual(
      secretList2.sort(),
    );
  });
  test('can edit secrets in a vault', async () => {
    const editSecretVault = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.vaultsEditSecret,
    );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const secretList = ['Secret1', 'Secret2', 'Secret3', 'Secret4', 'Secret5'];

    for (const secretName of secretList) {
      await vault.addSecret(secretName, Buffer.from(secretName));
    }

    const m = new clientPB.SecretSpecificMessage();
    const mv = new clientPB.VaultSpecificMessage();
    const mvs = new clientPB.VaultMessage();
    mvs.setName(vault.vaultName);
    mv.setVault(mvs);
    mv.setName('Secret1');
    m.setContent('content-change');
    m.setVault(mv);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    await editSecretVault(m, meta, callCredentials);

    expect((await vault.getSecret('Secret1')).toString()).toStrictEqual(
      'content-change',
    );
  });
  test('can get secrets in a vault', async () => {
    const getSecretVault = grpcUtils.promisifyUnaryCall<clientPB.SecretMessage>(
      client,
      client.vaultsGetSecret,
    );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const secretList = ['Secret1', 'Secret2', 'Secret3', 'Secret4', 'Secret5'];

    for (const secretName of secretList) {
      await vault.addSecret(secretName, Buffer.from(secretName));
    }

    const m = new clientPB.VaultSpecificMessage();
    const mv = new clientPB.VaultMessage();
    mv.setName(vault.vaultName);
    m.setVault(mv);
    m.setName('Secret1');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    const response = await getSecretVault(m, meta, callCredentials);

    expect(response.getName().toString()).toStrictEqual('Secret1');
  });
  test('can rename secrets in a vault', async () => {
    const renameSecretVault =
      grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
        client,
        client.vaultsRenameSecret,
      );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const secretList = ['Secret1', 'Secret2', 'Secret3', 'Secret4', 'Secret5'];
    const secretList2 = ['Secret2', 'Secret3', 'Secret4', 'Secret5', 'Secret6'];

    for (const secretName of secretList) {
      await vault.addSecret(secretName, Buffer.from(secretName));
    }

    const m = new clientPB.SecretRenameMessage();
    const mv = new clientPB.VaultMessage();
    const mos = new clientPB.SecretMessage();
    const mns = new clientPB.SecretMessage();

    mv.setName(vault.vaultName);
    mos.setName('Secret1');
    mns.setName('Secret6');
    m.setVault(mv);
    m.setOldname(mos);
    m.setNewname(mns);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    const response = await renameSecretVault(m, meta, callCredentials);

    expect(response.getSuccess()).toBeTruthy();
    expect((await vault.listSecrets()).sort()).toStrictEqual(
      secretList2.sort(),
    );
  });
  test('can add secrets in a vault', async () => {
    const newSecretVault = grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      client,
      client.vaultsNewSecret,
    );

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const m = new clientPB.SecretNewMessage();
    const mv = new clientPB.VaultMessage();
    mv.setName(vault.vaultName);
    m.setVault(mv);
    m.setName('Secret1');
    m.setContent('secret-content');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    const response = await newSecretVault(m, meta, callCredentials);

    expect(response.getSuccess()).toBeTruthy();
    expect((await vault.listSecrets()).sort()).toStrictEqual(['Secret1']);
    expect((await vault.getSecret('Secret1')).toString()).toStrictEqual(
      'secret-content',
    );
  });
  test('can add a directory of secrets in a vault', async () => {
    const newDirSecretVault =
      grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
        client,
        client.vaultsNewDirSecret,
      );

    // make a temp file for editing
    const tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'pksecret'),
    );
    const secrets: Array<string> = [];
    for (let i = 0; i < 10; i++) {
      const tmpFile = `${tmpDir}/pkSecretFile${i.toString()}`;
      secrets.push(
        path.join(`${path.basename(tmpDir)}`, `pkSecretFile${i.toString()}`),
      );
      // write secret to file
      await fs.promises.writeFile(tmpFile, tmpFile);
    }

    const vault = await vaultManager.createVault('MyFirstVault');
    await vault.initializeVault();

    const m = new clientPB.SecretNewMessage();
    const mv = new clientPB.VaultMessage();
    mv.setName(vault.vaultName);
    m.setVault(mv);
    m.setName(tmpDir);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    await newDirSecretVault(m, meta, callCredentials);

    expect((await vault.listSecrets()).sort()).toStrictEqual(secrets.sort());

    // remove temp directory
    await fs.promises.rmdir(tmpDir, { recursive: true });
  });
  test('can add permissions to a vault', async () => {
    const vaultsShare = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.vaultsShare
    );

    //creating a vault.
    await vaultManager.createVault('vault1');
    const vaults = await vaultManager.listVaults();
    const vaultId = vaults[0].id;

    //creating a gestalts state
    const info = await createGestaltState();

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    //Doing the tests.
    const shareMessage = new clientPB.ShareMessage();
    const ids = [node2.id];
    shareMessage.setName(vaultId);
    shareMessage.setId(JSON.stringify(ids)); //nodeIDs
    shareMessage.setSet(false);
    await vaultsShare(shareMessage, callCredentials);

    const result = await vaultManager.getVaultPermissions(vaultId);
    const stringResult = JSON.stringify(result);
    expect(stringResult).toContain(node2.id);
    expect(stringResult).toContain('pull');
  });
  test('can remove permissions to a vault', async () => {
    const vaultsShare = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.vaultsShare,
    );

    //creating a vault.
    await vaultManager.createVault('vault1');
    const vaults = await vaultManager.listVaults();
    const vaultId = vaults[0].id;

    //creating a gestalts state
    const info = await createGestaltState();
    await vaultManager.setVaultPerm(node2.id, vaultId);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    //Doing the tests.
    const shareMessage = new clientPB.ShareMessage();
    const ids = [node2.id];
    shareMessage.setName(vaultId);
    shareMessage.setId(JSON.stringify(ids)); //nodeIDs
    shareMessage.setSet(true); //Removing permission.
    await vaultsShare(shareMessage, callCredentials);

    const result = await vaultManager.getVaultPermissions(vaultId);
    const stringResult = JSON.stringify(result);
    expect(stringResult).toContain(node2.id);
    expect(stringResult.includes('pull')).toBeFalsy();
  });
  test('can get permissions to a vault', async () => {
    const vaultsPermissions =
      grpcUtils.promisifyReadableStreamCall<clientPB.PermissionMessage>(
        client,
        client.vaultsPermissions,
      );
    //name = vaultID
    //id = nodeID

    //creating a vault.
    await vaultManager.createVault('vault1');
    const vaults = await vaultManager.listVaults();
    const vaultId = vaults[0].id;

    //creating a gestalts state
    const info = await createGestaltState();
    await vaultManager.setVaultPerm(node2.id, vaultId);

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);
    //Doing the tests.
    const shareMessage = new clientPB.ShareMessage();
    shareMessage.setName(vaultId);
    shareMessage.setId(node2.id);
    const resGen = vaultsPermissions(shareMessage, callCredentials);

    const results: Array<clientPB.PermissionMessage.AsObject> = [];
    for await (const res of resGen) {
      results.push(res.toObject());
    }
    const resultsString = JSON.stringify(results);
    expect(resultsString).toContain(node2.id);
    expect(resultsString).toContain('pull');
  });
  test('can get root keypair', async () => {
    const getRootKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.KeyPairMessage>(
        client,
        client.keysRootKeyPair,
      );

    const keyPair = await keyManager.getRootKeyPairPem();

    const m = new clientPB.EmptyMessage();

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const key = await getRootKeyPair(m, meta, callCredentials);

    expect(key.getPrivate()).toBe(keyPair.privateKey);
    expect(key.getPublic()).toBe(keyPair.publicKey);
  });
  test('can reset root keypair', async () => {
    const getRootKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.KeyPairMessage>(
        client,
        client.keysRootKeyPair,
      );

    const resetKeyPair = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.keysResetKeyPair,
    );

    const keyPair = await keyManager.getRootKeyPairPem();

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const m = new clientPB.KeyMessage();
    m.setName('somepassphrase');

    await resetKeyPair(m, meta, callCredentials);

    const mv = new clientPB.EmptyMessage();

    await fs.promises.writeFile(passwordFile, 'somepassphrase');

    const key = await getRootKeyPair(mv, meta, callCredentials);

    expect(key.getPrivate()).not.toBe(keyPair.privateKey);
    expect(key.getPublic()).not.toBe(keyPair.publicKey);
  });
  test('can renew root keypair', async () => {
    const renewKeyPair = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      client,
      client.keysRenewKeyPair,
    );

    const rootKeyPair1 = await keyManager.getRootKeyPairPem();

    const m = new clientPB.KeyMessage();
    m.setName('somepassphrase');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    await renewKeyPair(m, meta, callCredentials);

    const rootKeyPair2 = keyManager.getRootKeyPairPem();

    expect(rootKeyPair2.privateKey).not.toBe(rootKeyPair1.privateKey);
    expect(rootKeyPair2.publicKey).not.toBe(rootKeyPair1.publicKey);
  });
  test('can encrypt and decrypt with root keypair', async () => {
    const encryptWithKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
        client,
        client.keysEncrypt,
      );

    const decryptWithKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
        client,
        client.keysDecrypt,
      );

    const plainText = Buffer.from('abc');
    const cryptoMessage = new clientPB.CryptoMessage();
    cryptoMessage.setData(plainText.toString('binary'));

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const cipherText = await encryptWithKeyPair(
      cryptoMessage,
      meta,
      callCredentials,
    );

    cryptoMessage.setData(cipherText.getData());
    const plainText_ = await decryptWithKeyPair(
      cryptoMessage,
      meta,
      callCredentials,
    );

    expect(plainText_.getData()).toBe(plainText.toString());
  });
  test('can encrypt and decrypt with root keypair', async () => {
    const signWithKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
        client,
        client.keysSign,
      );

    const verifyWithKeyPair =
      grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
        client,
        client.keysVerify,
      );

    const data = Buffer.from('abc');
    const cryptoMessage = new clientPB.CryptoMessage();
    cryptoMessage.setData(data.toString('binary'));

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const signature = await signWithKeyPair(
      cryptoMessage,
      meta,
      callCredentials,
    );

    cryptoMessage.setSignature(signature.getSignature());

    const signed = await verifyWithKeyPair(
      cryptoMessage,
      meta,
      callCredentials,
    );

    expect(signed.getSuccess()).toBe(true);
  });
  test('can change password', async () => {
    const changePasswordKeys =
      grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
        client,
        client.keysChangePassword,
      );

    const m = new clientPB.PasswordMessage();
    m.setPassword('newpassword');

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    await changePasswordKeys(m, meta, callCredentials);

    await nodeManager.stop();
    await vaultManager.stop();
    await keyManager.stop();

    await expect(keyManager.start({ password: 'password' })).rejects.toThrow();
  });
  test('can get the root certificate and chains', async () => {
    const getCerts = grpcUtils.promisifyUnaryCall<clientPB.CertificateMessage>(
      client,
      client.certsGet,
    );

    const getChainCerts =
      grpcUtils.promisifyReadableStreamCall<clientPB.CertificateMessage>(
        client,
        client.certsChainGet,
      );

    const m = new clientPB.EmptyMessage();

    const meta = new grpc.Metadata();
    meta.set('passwordFile', passwordFile);

    const res = getChainCerts(m, meta, callCredentials);
    const certs: Array<string> = [];
    for await (const val of res) {
      certs.push(val.getCert());
    }

    expect(certs.sort()).toStrictEqual(
      (await keyManager.getRootCertChainPems()).sort(),
    );

    const response = await getCerts(m, meta, callCredentials);

    expect(response.getCert()).toBe(keyManager.getRootCertPem());
  });
  test('getting all gestalts', async () => {
    const listGestalts =
      grpcUtils.promisifyReadableStreamCall<clientPB.GestaltMessage>(
        client,
        client.gestaltsList,
      );

    await gestaltGraph.setNode(node2);
    await gestaltGraph.setIdentity(identity1);

    const m = new clientPB.EmptyMessage();

    const res = listGestalts(m, callCredentials);

    const gestalts: Array<string> = [];
    for await (const val of res) {
      gestalts.push(JSON.parse(val.getName()));
    }
    const identityGestalt = await gestaltGraph.getGestaltByIdentity(
      identity1.providerId,
      identity1.identityId,
    );
    const nodeGestalt = await gestaltGraph.getGestaltByNode(node2.id);
    expect(gestalts).toContainEqual(identityGestalt);
    expect(gestalts).toContainEqual(nodeGestalt);
    expect(gestalts).toHaveLength(2);
  });
  test('setting independent node and identity gestalts', async () => {
    await gestaltGraph.setNode(node2);
    await gestaltGraph.setIdentity(identity1);
    const gestaltNode = await gestaltGraph.getGestaltByNode(node2.id);
    const gestaltIdentity = await gestaltGraph.getGestaltByIdentity(
      identity1.providerId,
      identity1.identityId,
    );
    const gkNode = gestaltsUtils.keyFromNode(node2.id);
    const gkIdentity = gestaltsUtils.keyFromIdentity(
      identity1.providerId,
      identity1.identityId,
    );
    expect(gestaltNode).toStrictEqual({
      matrix: { [gkNode]: {} },
      nodes: { [gkNode]: node2 },
      identities: {},
    });
    expect(gestaltIdentity).toStrictEqual({
      matrix: { [gkIdentity]: {} },
      nodes: {},
      identities: { [gkIdentity]: identity1 },
    });
  });
  //Identities.
  describe('Identities', () => {
    test('can Authenticate an identity.', async () => {
      const identitiesAuthenticate =
        grpcUtils.promisifyReadableStreamCall<clientPB.ProviderMessage>(
          client,
          client.identitiesAuthenticate,
        );

      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(testToken.providerId);
      providerMessage.setMessage(testToken.identityId);

      const gen = identitiesAuthenticate(providerMessage, callCredentials);

      const firstMessage = await gen.next();
      expect(firstMessage.done).toBeFalsy();
      expect(firstMessage.value).toBeTruthy();
      if (!firstMessage.value) fail('Failed to return a message');
      expect(firstMessage.value.getMessage()).toContain('randomtestcode');

      const secondMessage = await gen.next();
      expect(secondMessage.done).toBeFalsy();
      expect(secondMessage.value).toBeTruthy();
      if (!secondMessage.value) fail('Failed to return a message');
      expect(secondMessage.value.getMessage()).toContain('test_user');

      expect((await gen.next()).done).toBeTruthy();
    });
    test('token manipulation for providers', async () => {
      const putToken = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
        client,
        client.tokensPut,
      );

      const getTokens = grpcUtils.promisifyUnaryCall<clientPB.TokenMessage>(
        client,
        client.tokensGet,
      );

      const delToken = grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
        client,
        client.tokensDelete,
      );
      const providerId = 'test-provider' as ProviderId;
      const identityId = 'test-user' as IdentityId;
      const tokenData = {
        accessToken: 'abc',
      };

      const mp = new clientPB.ProviderMessage();
      const m = new clientPB.TokenSpecificMessage();

      mp.setId(providerId);
      mp.setMessage(identityId);

      m.setProvider(mp);
      m.setToken('abc');

      await putToken(m, callCredentials);

      const tokenData_ = await getTokens(mp, callCredentials);
      expect(JSON.stringify(tokenData)).toStrictEqual(tokenData_.getToken());

      await delToken(mp, callCredentials);
      await delToken(mp, callCredentials);
      const tokenData__ = await getTokens(mp, callCredentials);
      expect(tokenData__.getToken()).toBe('');
    });
    test('can list providers.', async () => {
      const providersGet =
        grpcUtils.promisifyUnaryCall<clientPB.ProviderMessage>(
          client,
          client.providersGet,
        );

      const emptyMessage = new clientPB.EmptyMessage();
      const test = await providersGet(emptyMessage, callCredentials);
      expect(test.getId()).toContain('github.com');
      expect(test.getId()).toContain('test-provider');
    });
    test('can list connected Identities.', async () => {
      const identitiesGetConnectedInfos =
        grpcUtils.promisifyReadableStreamCall<clientPB.IdentityInfoMessage>(
          client,
          client.identitiesGetConnectedInfos,
        );

      // Add the identity + token.
      await identitiesManager.putToken(
        testToken.providerId,
        testToken.identityId,
        testToken.tokenData,
      );

      const providerSearchMessage = new clientPB.ProviderSearchMessage();
      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(testToken.providerId);
      providerMessage.setMessage(testToken.identityId);
      providerSearchMessage.setProvider(providerMessage);
      providerSearchMessage.setSearchTermList([]);

      const resGen = identitiesGetConnectedInfos(
        providerSearchMessage,
        callCredentials,
      );
      let output = '';
      for await (const identityInfoMessage of resGen) {
        const objString = JSON.stringify(identityInfoMessage.toObject());
        output += objString;
      }
      expect(output).toContain('test_user2');
      expect(output).toContain('test_user2@test.com');
    });
    test('can get identity info.', async () => {
      const identitiesGetInfo =
        grpcUtils.promisifyUnaryCall<clientPB.ProviderMessage>(
          client,
          client.identitiesGetInfo,
        );
      //Create an identity
      await identitiesManager.putToken(
        testToken.providerId,
        testToken.identityId,
        testToken.tokenData,
      );

      //Geting the info.
      const providerMessage1 = new clientPB.ProviderMessage();
      providerMessage1.setId(testToken.providerId);
      const providerMessage = await identitiesGetInfo(
        providerMessage1,
        callCredentials,
      );
      expect(providerMessage.getId()).toBe(testToken.providerId);
      expect(providerMessage.getMessage()).toBe(testToken.identityId);
    });
    test('Can augment a keynode.', async () => {
      const identitiesAugmentKeynode =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.identitiesAugmentKeynode,
        );
      //Need an authenticated identity.
      await identitiesManager.putToken(
        testToken.providerId,
        testToken.identityId,
        testToken.tokenData,
      );

      //making the call.
      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(testToken.providerId);
      providerMessage.setMessage(testToken.identityId);
      await identitiesAugmentKeynode(providerMessage, callCredentials);

      const res = await gestaltGraph.getGestaltByNode(nodeId);
      const resString = JSON.stringify(res);
      expect(resString).toContain(testToken.providerId);
      expect(resString).toContain(testToken.identityId);
    });
  });
  //gestalts
  describe('gestalts', () => {
    test('can get gestalt from Node.', async () => {
      const gestaltsGetNode =
        grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
          client,
          client.gestaltsGetNode,
        );
      const info = await createGestaltState();

      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(node2.id);

      //making the call
      const res = await gestaltsGetNode(nodeMessage, callCredentials);
      const jsonString = res.getName();

      expect(jsonString).toContain('IdentityIdABC'); // Contains IdentityID
      expect(jsonString).toContain('github.com'); // Contains github provider.
      expect(jsonString).toContain('NodeIdABC'); // Contains NodeId.
    });
    test('can get gestalt from identity.', async () => {
      const gestaltsGetIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
          client,
          client.gestaltsGetIdentity,
        );
      const info = await createGestaltState();
      //testing the call
      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(identity1.providerId);
      providerMessage.setMessage(identity1.identityId);
      const res = await gestaltsGetIdentity(providerMessage, callCredentials);
      const jsonString = res.getName();

      expect(jsonString).toContain('IdentityIdABC'); // Contains IdentityID
      expect(jsonString).toContain('github.com'); // Contains github provider.
      expect(jsonString).toContain('NodeIdABC'); // Contains NodeId.
    });
    test('can get all gestalts', async () => {
      const listGestalts =
        grpcUtils.promisifyReadableStreamCall<clientPB.GestaltMessage>(
          client,
          client.gestaltsList,
        );

      await gestaltGraph.setNode(node2);
      await gestaltGraph.setIdentity(identity1);

      const m = new clientPB.EmptyMessage();

      const res = listGestalts(m, callCredentials);

      const gestalts: Array<string> = [];
      for await (const val of res) {
        gestalts.push(JSON.parse(val.getName()));
      }
      const identityGestalt = await gestaltGraph.getGestaltByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const nodeGestalt = await gestaltGraph.getGestaltByNode(node2.id);
      console.log(gestalts);
      expect(gestalts).toContainEqual(identityGestalt);
      expect(gestalts).toContainEqual(nodeGestalt);
      expect(gestalts).toHaveLength(2);
    });
    test('can set/unset a gestalt Node.', async () => {
      const gestaltsSetNode =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsSetNode,
        );

      await gestaltGraph.setNode(node1);

      const gestaltTrustMessage = new clientPB.GestaltTrustMessage();
      gestaltTrustMessage.setName(node2.id);
      gestaltTrustMessage.setSet(true);

      //Making the call.
      await gestaltsSetNode(gestaltTrustMessage, callCredentials);

      const res = await gestaltGraph.getGestaltByNode(node1.id);
      const resString = JSON.stringify(res);
      expect(resString).toContain(node1.id);
      expect(resString).toContain(node2.id);

      gestaltTrustMessage.setSet(false);
      await gestaltsSetNode(gestaltTrustMessage, callCredentials);

      const res2 = await gestaltGraph.getGestaltByNode(node1.id);
      const resString2 = JSON.stringify(res2);
      expect(resString2).toContain(node1.id);
      expect(resString2.includes(node2.id)).toBeFalsy();
    });
    test('can set/unset a gestalt Identity.', async () => {
      const gestaltsSetIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsSetIdentity,
        );

      await gestaltGraph.setNode(node1);
      await gestaltGraph.setIdentity(identity1);

      const gestaltTrustMessage = new clientPB.GestaltTrustMessage();
      gestaltTrustMessage.setProvider(identity1.providerId);
      gestaltTrustMessage.setName(identity1.identityId);
      gestaltTrustMessage.setSet(true);

      //Making the call.
      await gestaltsSetIdentity(gestaltTrustMessage, callCredentials);

      const res = await gestaltGraph.getGestaltByNode(node1.id);
      const resString = JSON.stringify(res);
      expect(resString).toContain(identity1.providerId);
      expect(resString).toContain(identity1.identityId);
      expect(resString).toContain(node1.id);

      gestaltTrustMessage.setSet(false);
      await gestaltsSetIdentity(gestaltTrustMessage, callCredentials);

      const res2 = await gestaltGraph.getGestaltByNode(node1.id);
      const resString2 = JSON.stringify(res2);
      expect(resString2).toContain(node1.id);
      expect(resString2.includes(identity1.providerId)).toBeFalsy();
      expect(resString2.includes(identity1.identityId)).toBeFalsy();
    });
    test('can discover gestalt via Node.', async () => {
      const gestaltsDiscoverNode =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsDiscoverNode,
        );

      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(node2.id);
      //I have no idea how to test this. so we just check for expected error for now.
      await expect(gestaltsDiscoverNode(nodeMessage, callCredentials))
        .rejects.toThrow(ErrorNodeGraphEmptyShortlist);
    });
    test('can discover gestalt via Identity.', async () => {
      const gestaltsDiscoverIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsDiscoverIdentity,
        );

      await identitiesManager.putToken(
        testToken.providerId,
        testToken.identityId,
        testToken.tokenData,
      );

      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(testToken.providerId);
      providerMessage.setMessage(testToken.identityId);
      //Technically contains a node, but no other thing, will succeed with no results.
      expect(await gestaltsDiscoverIdentity(providerMessage, callCredentials))
        .toBeInstanceOf(clientPB.EmptyMessage);
    });
    test('Should get gestalt permissions by node.', async () => {
      const gestaltsGetActionsByNode =
        grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
          client,
          client.gestaltsGetActionsByNode,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);
      await gestaltGraph.setGestaltActionByNode(node2.id, 'scan');
      await gestaltGraph.setGestaltActionByNode(node2.id, 'notify');

      const nodeMessage = new clientPB.NodeMessage();

      nodeMessage.setName(node2.id);
      // Should have permissions scan and notify as above.
      const test1 = await gestaltsGetActionsByNode(
        nodeMessage,
        callCredentials,
      );
      expect(test1.getActionList().length).toBe(2);
      expect(test1.getActionList().includes('scan')).toBeTruthy();
      expect(test1.getActionList().includes('notify')).toBeTruthy();

      nodeMessage.setName(nodeId);
      // Should have no permissions.
      const test2 = await gestaltsGetActionsByNode(
        nodeMessage,
        callCredentials,
      );
      expect(test2.getActionList().length).toBe(0);
    });
    test('Should get gestalt permissions by Identity.', async () => {
      const gestaltsGetActionsByIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
          client,
          client.gestaltsGetActionsByIdentity,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);
      await gestaltGraph.setIdentity(identity1);
      await gestaltGraph.linkNodeAndIdentity(node2, identity1);
      await gestaltGraph.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'scan',
      );
      await gestaltGraph.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'notify',
      );

      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(identity1.providerId);
      providerMessage.setMessage(identity1.identityId);
      // Should have permissions scan and notify as above.
      const test1 = await gestaltsGetActionsByIdentity(
        providerMessage,
        callCredentials,
      );
      expect(test1.getActionList().length).toBe(2);
      expect(test1.getActionList().includes('scan')).toBeTruthy();
      expect(test1.getActionList().includes('notify')).toBeTruthy();

      providerMessage.setId(identity1.providerId);
      providerMessage.setMessage('Not a real identity');
      // Should have no permissions.
      const test2 = await gestaltsGetActionsByIdentity(
        providerMessage,
        callCredentials,
      );
      expect(test2.getActionList().length).toBe(0);
    });
    test('Should set gestalt permissions by node.', async () => {
      const gestaltsSetActionByNode =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsSetActionByNode,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);

      const setActionsMessage = new clientPB.SetActionsMessage();
      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(node2.id);
      setActionsMessage.setNode(nodeMessage);
      setActionsMessage.setAction('scan');
      // Should have permissions scan and notify as above.
      await gestaltsSetActionByNode(setActionsMessage, callCredentials);

      const check1 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      expect(Object.keys(check1!)).toContain('scan');

      setActionsMessage.setAction('notify');
      await gestaltsSetActionByNode(setActionsMessage, callCredentials);
      const check2 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      expect(Object.keys(check2!)).toContain('notify');
    });
    test('Should set gestalt permissions by Identity.', async () => {
      const gestaltsSetActionByIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
          client,
          client.gestaltsSetActionByIdentity,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);
      await gestaltGraph.setIdentity(identity1);
      await gestaltGraph.linkNodeAndIdentity(node2, identity1);

      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(identity1.providerId);
      providerMessage.setMessage(identity1.identityId);

      const setActionsMessage = new clientPB.SetActionsMessage();
      setActionsMessage.setIdentity(providerMessage);
      setActionsMessage.setAction('scan');
      // Should have permissions scan and notify as above.
      await gestaltsSetActionByIdentity(setActionsMessage, callCredentials);

      const check1 = await gestaltGraph.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      expect(Object.keys(check1!)).toContain('scan');

      setActionsMessage.setAction('notify');
      await gestaltsSetActionByIdentity(setActionsMessage, callCredentials);
      const check2 = await gestaltGraph.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      expect(Object.keys(check2!)).toContain('notify');
    });
    test('Should unset gestalt permissions by node.', async () => {
      const gestaltsUnsetActionByNode =
        grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
          client,
          client.gestaltsUnsetActionByNode,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);
      await gestaltGraph.setGestaltActionByNode(node2.id, 'scan');
      await gestaltGraph.setGestaltActionByNode(node2.id, 'notify');

      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(node2.id);

      const setActionsMessage = new clientPB.SetActionsMessage();
      setActionsMessage.setNode(nodeMessage);
      setActionsMessage.setAction('scan');

      // Should have permissions scan and notify as above.
      await gestaltsUnsetActionByNode(setActionsMessage, callCredentials);
      const check1 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      const keys = Object.keys(check1!);
      expect(keys.length).toBe(1);
      expect(keys).toContain('notify');
      expect(keys.includes('scan')).toBeFalsy();

      setActionsMessage.setAction('notify');
      await gestaltsUnsetActionByNode(setActionsMessage, callCredentials);
      const check2 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      const keys2 = Object.keys(check2!);
      expect(keys2.length).toBe(0);
    });
    test('Should unset gestalt permissions by Identity.', async () => {
      const gestaltsUnsetActionByIdentity =
        grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
          client,
          client.gestaltsUnsetActionByIdentity,
        );
      await gestaltGraph.setNode(node1);
      await gestaltGraph.setNode(node2);
      await gestaltGraph.setIdentity(identity1);
      await gestaltGraph.linkNodeAndIdentity(node2, identity1);
      await gestaltGraph.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'scan',
      );
      await gestaltGraph.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'notify',
      );

      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(identity1.providerId);
      providerMessage.setMessage(identity1.identityId);

      const setActionsMessage = new clientPB.SetActionsMessage();
      setActionsMessage.setIdentity(providerMessage);
      setActionsMessage.setAction('scan');

      // Should have permissions scan and notify as above.
      await gestaltsUnsetActionByIdentity(setActionsMessage, callCredentials);
      const check1 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      const keys = Object.keys(check1!);
      expect(keys.length).toBe(1);
      expect(keys).toContain('notify');
      expect(keys.includes('scan')).toBeFalsy();

      setActionsMessage.setAction('notify');
      await gestaltsUnsetActionByIdentity(setActionsMessage, callCredentials);
      const check2 = await gestaltGraph.getGestaltActionsByNode(node2.id);
      const keys2 = Object.keys(check2!);
      expect(keys2.length).toBe(0);
    });
  });
});
