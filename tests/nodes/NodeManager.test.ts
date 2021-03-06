import type { NodeId } from '@/nodes/types';

import os from 'os';
import path from 'path';
import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { NodeManager } from '@/nodes';
import { ForwardProxy, ReverseProxy, utils as networkUtils } from '@/network';
import { KeyManager } from '@/keys';
import * as keysUtils from '@/keys/utils';

describe('NodeManager', () => {
  const logger = new Logger('NodeManagerTest', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  let dataDir: string;

  const fwdProxy = new ForwardProxy({
    authToken: 'abc',
    logger: logger,
  });
  const revProxy = new ReverseProxy({
    logger: logger,
  });
  let keyManager: KeyManager;
  let keyPairPem, certPem;
  let nodeId: NodeId;

  beforeAll(async () => {
    const keyPair = await keysUtils.generateKeyPair(4096);
    keyPairPem = keysUtils.keyPairToPem(keyPair);
    const cert = keysUtils.generateCertificate(
      keyPair.publicKey,
      keyPair.privateKey,
      keyPair.privateKey,
      86400,
    );
    certPem = keysUtils.certToPem(cert);
    nodeId = networkUtils.certNodeId(cert);
  });

  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    const keysPath = `${dataDir}/keys`;
    keyManager = new KeyManager({ keysPath, logger });
    await keyManager.start({ password: 'password' });
    await fwdProxy.start({
      tlsConfig: {
        keyPrivatePem: keyPairPem,
        certChainPem: certPem,
      },
    });
  });
  afterEach(async () => {
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
    await keyManager.stop();
    await fwdProxy.stop();
  });

  test('construction has no side effects', async () => {
    const nodesPath = `${dataDir}/nodes`;
    new NodeManager({
      nodesPath: nodesPath,
      keyManager: keyManager,
      fwdProxy: fwdProxy,
      revProxy: revProxy,
      logger: logger,
    });
    await expect(fs.promises.stat(nodesPath)).rejects.toThrow(/ENOENT/);
  });
  test('async start constructs the node leveldb', async () => {
    const nodesPath = `${dataDir}/nodes`;
    const nodeManager = new NodeManager({
      nodesPath: nodesPath,
      keyManager: keyManager,
      fwdProxy: fwdProxy,
      revProxy: revProxy,
      logger: logger,
    });
    await nodeManager.start({
      nodeId: nodeId,
    });
    const nodesPathContents = await fs.promises.readdir(nodesPath);
    expect(nodesPathContents).toContain('buckets_db');
    await nodeManager.stop();
  });
});
