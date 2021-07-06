import fs from 'fs';
import path from 'path';
import os from 'os';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';

import { bootstrapPolykeyState, checkKeynodeState } from '@/bootstrap';
import PolykeyAgent from '@/PolykeyAgent';

import * as bootstrapErrors from '@/bootstrap/errors';
import * as agentUtils from '@/agent/utils';

const logger = new Logger('AgentServerTest', LogLevel.WARN, [
  new StreamHandler(),
]);

async function fakeKeynode(nodePath) {
  await fs.promises.mkdir(path.join(nodePath, 'keys'));
  await fs.promises.mkdir(path.join(nodePath, 'vaults'));
  await fs.promises.mkdir(path.join(nodePath, 'nodes'));
  await fs.promises.mkdir(path.join(nodePath, 'identities'));
  await fs.promises.mkdir(path.join(nodePath, 'db'));
}

describe('Bootstrap', () => {
  let nodePath: string;
  beforeEach(async () => {
    nodePath = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'lockfile-test-'),
    );
  });

  afterEach(async () => {
    await fs.promises.rm(nodePath, {
      force: true,
      recursive: true,
    });
  });

  describe('checkKeynodeState', () => {
    test('No directory', async () => {
      await fs.promises.rmdir(nodePath);
      expect(await checkKeynodeState(nodePath)).toBe('NO_DIRECTORY');
    });

    test('Empty directory', async () => {
      expect(await checkKeynodeState(nodePath)).toBe('EMPTY_DIRECTORY');
    });

    test('other contents in directory', async () => {
      await fs.promises.mkdir(path.join(nodePath, 'NotAnNodeDirectory'));
      expect(await checkKeynodeState(nodePath)).toBe('OTHER_EXISTS');
    });

    test('Keynode without contents in directory', async () => {
      await fakeKeynode(nodePath);
      expect(await checkKeynodeState(nodePath)).toBe('MALFORMED_KEYNODE');
    });

    test('Keynode without contents in directory', async () => {
      const pk = new PolykeyAgent({
        nodePath: nodePath,
        logger: logger,
      });
      await pk.start({ password: 'password' });
      await pk.stop();
      expect(await checkKeynodeState(nodePath)).toBe('KEYNODE_EXISTS');
    }, 20000);
  });

  describe('BootstrapPolykeyState', () => {
    const password = 'password123';
    test('should create state if no directory', async () => {
      await fs.promises.rmdir(nodePath);

      await bootstrapPolykeyState(nodePath, password);
      //Should have keynode state;
      expect(await checkKeynodeState(nodePath)).toBe('KEYNODE_EXISTS');
    });

    test('should create state if empty directory', async () => {
      await bootstrapPolykeyState(nodePath, password);
      expect(await checkKeynodeState(nodePath)).toBe('KEYNODE_EXISTS');
    });

    test('Should throw error if other files exists.', async () => {
      await fs.promises.mkdir(path.join(nodePath, 'NotAnNodeDirectory'));
      await expect(bootstrapPolykeyState(nodePath, password)).rejects.toThrow(
        bootstrapErrors.ErrorExistingState,
      );
    });

    test('Should throw error if keynode already exists.', async () => {
      await fakeKeynode(nodePath);
      await expect(bootstrapPolykeyState(nodePath, password)).rejects.toThrow(
        bootstrapErrors.ErrorMalformedKeynode,
      );
    });

    test('Should be able to start agent on created state.', async () => {
      await bootstrapPolykeyState(nodePath, password);
      const polykeyAgent = new PolykeyAgent({
        nodePath: nodePath,
        logger: logger,
      });
      await polykeyAgent.start({ password });
      expect(await agentUtils.checkAgentRunning(nodePath)).toBeTruthy();
      await polykeyAgent.stop();
      expect(await agentUtils.checkAgentRunning(nodePath)).toBeFalsy();
    });
  });
});
