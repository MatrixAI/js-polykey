import fs from 'fs';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import * as grpc from '@grpc/grpc-js';
import { clientPB } from '../../client';
import PolykeyClient from '../../PolykeyClient';
import * as utils from '../../utils';
import * as binUtils from '../utils';
import * as CLIErrors from '../errors';
import * as grpcErrors from '../../grpc/errors';

const commandCreateSecret = binUtils.createCommand('put', {
  description: 'Creates a secret within a given vault',
  aliases: ['create', 'touch', 'new'],
  nodePath: true,
  verbose: true,
  format: true,
  passwordFile: true,
});
commandCreateSecret.requiredOption(
  '-sp, --secret-path <secretPath>',
  '(required) Path to the secret to be added, specified as <vaultName>:<secretPath>',
);
commandCreateSecret.requiredOption(
  '-fp, --file-path <filePath>',
  '(required) File path containing the secret to be added',
);
commandCreateSecret.action(async (options) => {
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
  const secretNewMessage = new clientPB.SecretNewMessage();
  const vaultMessage = new clientPB.VaultMessage();

  try {
    await client.start({});
    const grpcClient = client.grpcClient;

    const secretPath: string = options.secretPath;
    if (!binUtils.pathRegex.test(secretPath)) {
      throw new CLIErrors.ErrorSecretPathFormat();
    }
    const [, vaultName, secretName] = secretPath.match(binUtils.pathRegex)!;

    const content = fs.readFileSync(options.filePath, { encoding: 'utf-8' });

    vaultMessage.setName(vaultName);
    secretNewMessage.setVault(vaultMessage);
    secretNewMessage.setName(secretName);
    secretNewMessage.setContent(content);

    const pCall = grpcClient.vaultsNewSecret(secretNewMessage, meta);

    const responseMessage = await pCall;
    if (responseMessage.getSuccess()) {
      process.stdout.write(
        binUtils.outputFormatter({
          type: options.format === 'json' ? 'json' : 'list',
          data: [
            `Secret: ${secretNewMessage.getName()} successfully created in vault: ${vaultMessage.getName()}`,
          ],
        }),
      );
    } else {
      process.stdout.write(
        binUtils.outputFormatter({
          type: options.format === 'json' ? 'json' : 'list',
          data: [
            `Failed to create secret: ${secretNewMessage.getName()} in vault: ${vaultMessage.getName()}`,
          ],
        }),
      );
    }
  } catch (err) {
    if (err instanceof grpcErrors.ErrorGRPCClientTimeout) {
      process.stderr.write(`${err.message}\n`);
    }
    if (err instanceof grpcErrors.ErrorGRPCServerNotStarted) {
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
    client.stop();
    options.passwordFile = undefined;
    options.nodePath = undefined;
    options.verbose = undefined;
    options.format = undefined;
  }
});

export default commandCreateSecret;
