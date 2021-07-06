import type { NodeId, NodeInfo } from '@/nodes/types';
import * as testUtils from './utils';

import os from 'os';
import path from 'path';
import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { PolykeyAgent } from '@';
import {
  IdentityId,
  IdentityInfo,
  ProviderId,
} from '../../src/identities/types';
import { identityString } from '../../src/bin/identities/utils';
import commandAuthenticateProvider from '../../dist/bin/identities/commandAuthenticateProvider';
import * as utils from './utils';
import { GithubProvider } from '../../src/identities/providers';
import TestProvider from '../identities/TestProvider';

const logger = new Logger('pkWithStdio Test', LogLevel.WARN, [
  new StreamHandler(),
]);
let dataDir: string;
let nodePath: string;
let passwordFile: string;
let passOpt;
let polykeyAgent: PolykeyAgent;
const node1: NodeInfo = {
  id: '123' as NodeId,
  chain: {},
};
const keynode: NodeInfo = {
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
const invaldNode: NodeInfo = {
  id: 'invalid' as NodeId,
  chain: {},
};
const identity1: IdentityInfo = {
  providerId: 'github.com' as ProviderId,
  identityId: 'abc' as IdentityId,
  claims: {},
};
const invalidIdentity: IdentityInfo = {
  providerId: 'github.com' as ProviderId,
  identityId: 'onetwothree' as IdentityId,
  claims: {},
};

const token = {
  providerId: 'github.com' as ProviderId,
  identityId: 'tegefaulkes' as IdentityId,
  tokenData: {
    accessToken: 'DO NOT PUSH A TOKEN.',
  },
};

const testToken = {
  providerId: 'test-provider' as ProviderId,
  identityId: 'test_user' as IdentityId,
  tokenData: {
    accessToken: 'abc123',
  },
};

const noJWTFailCode = 77;

function genCommands(options: Array<string>) {
  return ['identities', ...options, '-np', nodePath];
}

describe('CLI Identities', () => {
  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    nodePath = path.join(dataDir, 'keynode');
    passwordFile = path.join(dataDir, 'passwordFile');
    await fs.promises.writeFile(passwordFile, 'password');
    polykeyAgent = new PolykeyAgent({
      nodePath: nodePath,
      logger: logger,
    });
    await polykeyAgent.start({
      password: 'password',
    });
    keynode.id = polykeyAgent.nodes.getNodeId();
    await polykeyAgent.gestalts.setNode(keynode);
    await polykeyAgent.gestalts.setNode(node1);
    await polykeyAgent.gestalts.setNode(node2);
    await polykeyAgent.gestalts.setNode(node3);
    await polykeyAgent.gestalts.setIdentity(identity1);
    await polykeyAgent.gestalts.linkNodeAndIdentity(node1, identity1);

    const githubProvider = new GithubProvider({
      clientId: 'ca5c4c520da868387c52',
    });
    const testProvider = new TestProvider();
    await polykeyAgent.identities.registerProvider(githubProvider);
    await polykeyAgent.identities.registerProvider(testProvider);

    // Authorize session
    await utils.pk([
      'agent',
      'unlock',
      '-np',
      nodePath,
      '--password-file',
      passwordFile,
    ]);
  });
  afterEach(async () => {
    await polykeyAgent.stop();
    await fs.promises.rmdir(dataDir, { recursive: true });
  });

  describe('commandAllowGestalts', () => {
    test('Should allow permissions on node.', async () => {
      const commands = genCommands(['allow', node1.id, 'notify']);
      const result = await testUtils.pk(commands);
      expect(result).toBe(0); //Succeeds.
      const actions = await polykeyAgent.gestalts.getGestaltActionsByNode(
        node1.id,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('notify');

      const command2 = genCommands(['allow', node1.id, 'scan']);
      const result2 = await testUtils.pkWithStdio(command2);
      expect(result2.code).toBe(0); //Succeeds.

      const actions2 = await polykeyAgent.gestalts.getGestaltActionsByNode(
        node1.id,
      );
      const actionKeys2 = Object.keys(actions2!);
      expect(actionKeys2).toContain('notify');
      expect(actionKeys2).toContain('scan');

      //Should fail for invalid action.
      const command3 = genCommands(['allow', node1.id, 'invalid']);
      const result3 = await testUtils.pkWithStdio(command3);
      expect(result3.code).toBe(1); //should fail.
    }, 40000);
    test('Should allow permissions on Identity.', async () => {
      const commands = genCommands([
        'allow',
        identityString(identity1.providerId, identity1.identityId),
        'notify',
      ]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('notify');

      const command2 = genCommands([
        'allow',
        identityString(identity1.providerId, identity1.identityId),
        'scan',
      ]);
      const result2 = await testUtils.pkWithStdio(command2);
      expect(result2.code).toBe(0); //Succeedes.

      const actions2 = await polykeyAgent.gestalts.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const actionKeys2 = Object.keys(actions2!);
      expect(actionKeys2).toContain('notify');
      expect(actionKeys2).toContain('scan');

      //Should fail for invalid action.
      const command3 = genCommands([
        'allow',
        identityString(identity1.providerId, identity1.identityId),
        'invalid',
      ]);
      const result3 = await testUtils.pkWithStdio(command3);
      expect(result3.code).toBe(1); //should fail.
    }, 40000);
    test('Should fail on invalid inputs.', async () => {
      let result;
      //invalid node.
      result = await testUtils.pkWithStdio(
        genCommands(['allow', invaldNode.id, 'scan']),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid identity
      result = await testUtils.pkWithStdio(
        genCommands([
          'allow',
          identityString(
            invalidIdentity.providerId,
            invalidIdentity.identityId,
          ),
          'scan',
        ]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid permission.
      result = await testUtils.pkWithStdio(
        genCommands(['allow', invaldNode.id, 'invalidPermission']),
      );
      expect(result.code === 0).toBeFalsy(); //fails..
    }, 40000);
  });
  describe('commandDisallowGestalts', () => {
    test('Should disallow permissions on Node.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'notify');
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'scan');

      const commands = genCommands(['disallow', node1.id, 'notify']);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByNode(
        node1.id,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('scan');
      expect(actionKeys).not.toContain('notify');
    });
    test('Should disallow permissions on Identity.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'notify',
      );
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'scan',
      );

      const commands = genCommands([
        'disallow',
        identityString(identity1.providerId, identity1.identityId),
        'scan',
      ]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('notify');
      expect(actionKeys).not.toContain('scan');
    });
    test('Should fail on invalid inputs.', async () => {
      let result;
      //invalid node.
      result = await testUtils.pkWithStdio(
        genCommands(['disallow', invaldNode.id, 'scan']),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid identity
      result = await testUtils.pkWithStdio(
        genCommands([
          'disallow',
          identityString(
            invalidIdentity.providerId,
            invalidIdentity.identityId,
          ),
          'scan',
        ]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid permission.
      result = await testUtils.pkWithStdio(
        genCommands(['disallow', node1.id, 'invalidPermission']),
      );
      expect(result.code === 0).toBeFalsy(); //fails..
    }, 40000);
  });
  describe('commandPermissionsGestalts', () => {
    test('Should get permissions on Node.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'notify');
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'scan');

      const commands = genCommands(['perms', node1.id]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.
      //Print result.
      expect(result.stdout).toContain('notify');
      expect(result.stdout).toContain('scan');
    });
    test('Should get permissons on Identity.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'notify',
      );
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'scan',
      );

      const commands = genCommands([
        'perms',
        identityString(identity1.providerId, identity1.identityId),
      ]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.
      //Print result.
      expect(result.stdout).toContain('scan');
      expect(result.stdout).toContain('notify');
    });
  });
  describe('commandTrustGestalts', () => {
    test('Should set trust on Node.', async () => {
      const commands = genCommands(['trust', node1.id]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByNode(
        node1.id,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('notify');
    });
    test('Should set trust on Identity.', async () => {
      const commands = genCommands([
        'trust',
        identityString(identity1.providerId, identity1.identityId),
      ]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('notify');
    });
    test('Should fail on invalid inputs.', async () => {
      let result;
      //invalid node.
      result = await testUtils.pkWithStdio(
        genCommands(['trust', invaldNode.id]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid identity
      result = await testUtils.pkWithStdio(
        genCommands([
          'trust',
          identityString(
            invalidIdentity.providerId,
            invalidIdentity.identityId,
          ),
        ]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..
    }, 40000);
  });
  describe('commandUntrustGestalts', () => {
    test('Should unset trust on Node.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'notify');
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'scan');

      const commands = genCommands(['untrust', node1.id]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByNode(
        node1.id,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('scan');
      expect(actionKeys).not.toContain('notify');
    });
    test('Should unset trust on Identity.', async () => {
      //Setting permissions.
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'notify',
      );
      await polykeyAgent.gestalts.setGestaltActionByIdentity(
        identity1.providerId,
        identity1.identityId,
        'scan',
      );

      const commands = genCommands([
        'untrust',
        identityString(identity1.providerId, identity1.identityId),
      ]);
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.

      const actions = await polykeyAgent.gestalts.getGestaltActionsByIdentity(
        identity1.providerId,
        identity1.identityId,
      );
      const actionKeys = Object.keys(actions!);
      expect(actionKeys).toContain('scan');
      expect(actionKeys).not.toContain('notify');
    });
    test('Should fail on invalid inputs.', async () => {
      let result;
      //invalid node.
      result = await testUtils.pkWithStdio(
        genCommands(['trust', invaldNode.id]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..

      //invalid identity
      result = await testUtils.pkWithStdio(
        genCommands([
          'untrust',
          identityString(
            invalidIdentity.providerId,
            invalidIdentity.identityId,
          ),
        ]),
      );
      expect(result.code === 0).toBeFalsy(); //fails..
    }, 40000);
  });
  describe('commandClaimKeynode', () => {
    test('Should claim a keynode.', async () => {
      //Create an identity
      // await polykeyAgent.identities.putToken(testToken.providerId, testToken.identityId, testToken.tokenData)

      const commands = [
        'identities',
        'claim',
        '-np',
        nodePath,
        testToken.providerId,
        testToken.identityId,
      ];
      const result = await testUtils.pk(commands);
      expect(result).toBe(0); //Succeeds.

      const gestalt = await polykeyAgent.gestalts.getGestaltByIdentity(
        testToken.providerId,
        testToken.identityId,
      );
      const gestaltString = JSON.stringify(gestalt);
      expect(gestaltString).toContain(testToken.providerId);
      expect(gestaltString).toContain(testToken.identityId);
      expect(gestaltString).toContain(keynode.id);
    });
  });
  describe('commandAuthenticateProvider', () => {
    test('Should authenticate provider.', async () => {
      //creating and registering github provider.

      //attempt to authenticate.
      const commands = [
        'identities',
        'authenticate',
        '-np',
        nodePath,
        testToken.providerId,
        testToken.identityId,
      ];
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.
      expect(result.stdout).toContain('randomtestcode');
      expect(result.stdout).toContain('test_user');
    });
  });
  describe('commandGetGestalts', () => {
    test('Should list gestalt by Node', async () => {
      const commands = ['identities', 'get', '-np', nodePath, node1.id];
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain(node1.id);
      expect(result.stdout).toContain(identity1.providerId);
      expect(result.stdout).toContain(identity1.identityId);
    });
    test('Should list gestalt by Identity', async () => {
      const commands = [
        'identities',
        'get',
        '-np',
        nodePath,
        '--identity',
        identity1.providerId,
        identity1.identityId,
      ];
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain(node1.id);
      expect(result.stdout).toContain(identity1.providerId);
      expect(result.stdout).toContain(identity1.identityId);
    });
  });
  describe('commandListGestalts', () => {
    test('Should list gestalts with permissions.', async () => {
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'notify');
      await polykeyAgent.gestalts.setGestaltActionByNode(node1.id, 'scan');
      await polykeyAgent.gestalts.setGestaltActionByNode(node2.id, 'scan');

      const commands = ['identities', 'list', '-np', nodePath];
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.
      expect(result.stdout).toContain('notify');
      expect(result.stdout).toContain('scan');
      expect(result.stdout).toContain(node1.id);
      expect(result.stdout).toContain(node2.id);
      expect(result.stdout).toContain(node3.id);
      expect(result.stdout).toContain(identity1.providerId);
      expect(result.stdout).toContain(identity1.identityId);

      const commands2 = [
        'identities',
        'list',
        '-np',
        nodePath,
        '--format',
        'json',
      ];
      const result2 = await testUtils.pkWithStdio(commands2);
      expect(result2.code).toBe(0); //Succeeds.
      expect(result2.stdout).toContain('notify');
      expect(result2.stdout).toContain('scan');
      expect(result2.stdout).toContain(node1.id);
      expect(result2.stdout).toContain(node2.id);
      expect(result2.stdout).toContain(node3.id);
      expect(result2.stdout).toContain(identity1.providerId);
      expect(result2.stdout).toContain(identity1.identityId);
    }, 40000);
  });
  describe('commandSearchIdentities', () => {
    test('Should find a connected identity.', async () => {
      //Create an identity
      await polykeyAgent.identities.putToken(
        testToken.providerId,
        testToken.identityId,
        testToken.tokenData,
      );
      const commands = [
        'identities',
        'search',
        '-np',
        nodePath,
        testToken.providerId,
      ];
      const result = await testUtils.pkWithStdio(commands);
      expect(result.code).toBe(0); //Succeeds.
      expect(result.stdout).toContain(testToken.providerId);
      expect(result.stdout).toContain(testToken.identityId);
    });
  });
  describe('Should fail when', () => {
    test('Session is not running.', async () => {
      // Authorize session
      await utils.pk(['agent', 'lock', '-np', nodePath]);

      let result;

      result = await testUtils.pk(genCommands(['allow', node1.id, 'notify']));
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk(
        genCommands(['disallow', node1.id, 'notify']),
      );
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk(genCommands(['perms', node1.id]));
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk(genCommands(['trust', node1.id]));
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk(genCommands(['untrust', node1.id]));
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk([
        'identities',
        'claim',
        '-np',
        nodePath,
        token.providerId,
        token.identityId,
      ]);
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk([
        'identities',
        'authenticate',
        '-np',
        nodePath,
        token.providerId,
        token.identityId,
      ]);
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk([
        'identities',
        'get',
        '-np',
        nodePath,
        node1.id,
      ]);
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk(['identities', 'list', '-np', nodePath]);
      expect(result).toBe(noJWTFailCode);

      result = await testUtils.pk([
        'identities',
        'search',
        '-np',
        nodePath,
        testToken.providerId,
      ]);
      expect(result).toBe(noJWTFailCode);
    });
  });
});
