import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import * as grpc from '@grpc/grpc-js';
import PolykeyClient from '../../PolykeyClient';
import { clientPB } from '../../client';
import * as utils from '../../utils';
import * as binUtils from '../utils';
import * as grpcErrors from '../../grpc/errors';

const commandVaultShare = binUtils.createCommand('unshare', {
  description: {
    description: 'Sets the permissions of a vault for Node Ids',
    args: {
      vaultName: 'Name or ID of vault to share',
      nodesList: 'List of nodes share to',
    },
  },

  nodePath: true,
  verbose: true,
  format: true,
  passwordFile: true,
});

commandVaultShare.arguments('<vaultName> [nodesList...]');
commandVaultShare.action(async (vaultName, nodesList, options) => {
  const meta = new grpc.Metadata();

  const clientConfig = {};
  clientConfig['logger'] = new Logger('CLI Logger', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  if (options.verbose) {
    clientConfig['logger'].setLevel(LogLevel.DEBUG);
  }
  if (options.passwordFile) {
    meta.set('passwordFile', options.passwordFile);
  }
  clientConfig['nodePath'] = options.nodePath
    ? options.nodePath
    : utils.getDefaultNodePath();

  const client = new PolykeyClient(clientConfig);

  const shareMessage = new clientPB.ShareMessage();
  shareMessage.setName(vaultName);
  shareMessage.setId(JSON.stringify(nodesList));
  shareMessage.setSet(true);

  try {
    await client.start({});
    const grpcClient = client.grpcClient;

    await grpcClient.vaultsShare(
      shareMessage,
      meta,
      await client.session.createJWTCallCredentials(),
    );

    process.stdout.write(
      binUtils.outputFormatter({
        type: options.format === 'json' ? 'json' : 'list',
        data: [
          `Shared Vault: ${shareMessage.getName()} to: ${shareMessage.getId()}`,
        ],
      }),
    );
  } catch (err) {
    if (err instanceof grpcErrors.ErrorGRPCClientTimeout) {
      process.stderr.write(`${err.message}\n`);
    } else if (err instanceof grpcErrors.ErrorGRPCServerNotStarted) {
      process.stderr.write(`${err.message}\n`);
    } else {
      process.stderr.write(
        binUtils.outputFormatter({
          type: 'error',
          description: err.description,
          message: err.message,
        }),
      );
      throw err;
    }
  } finally {
    await client.stop();
    options.passwordFile = undefined;
    options.nodePath = undefined;
    options.verbose = undefined;
    options.format = undefined;
  }
});

export default commandVaultShare;
