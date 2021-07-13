import path from 'path';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import * as grpc from '@grpc/grpc-js';
import { clientPB } from '../../client';
import PolykeyClient from '../../PolykeyClient';
import * as utils from '../../utils';
import * as binUtils from '../utils';
import * as CLIErrors from '../errors';
import * as grpcErrors from '../../grpc/errors';

const commandSecretEnv = binUtils.createCommand('env', {
  description: 'Runs a modified environment with injected secrets',
  nodePath: true,
  verbose: true,
  format: true,
  passwordFile: true,
});
commandSecretEnv.option(
  '-e, --export',
  'Export all variables',
);
commandSecretEnv.arguments(
  "Secrets to inject into env, of the format '<vaultName>:<secretPath>[=<variableName>]', you can also control what the environment variable will be called using '[<variableName>]' (defaults to upper, snake case of the original secret name)",
);
commandSecretEnv.action(async (options, command) => {
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

  let shellCommand;
  const data: string[] = [];

  const client = new PolykeyClient(clientConfig);
  const vaultSpecificMessage = new clientPB.VaultSpecificMessage();
  const vaultMessage = new clientPB.VaultMessage();

  try {
    const secretPathList: string[] = Array.from<string>(command.args.values());

    if (secretPathList.length < 1) {
      throw new CLIErrors.ErrorSecretsUndefined();
    }

    if(!binUtils.pathRegex.test(secretPathList[secretPathList.length - 1])) {
      shellCommand = secretPathList.pop();
    }

    if (secretPathList.length < 1) {
      throw new CLIErrors.ErrorSecretsUndefined();
    }

    const secretEnv = { ...process.env };

    await client.start({});
    const grpcClient = client.grpcClient;

    let output = '';
    let secrets: string[] = [];

    for (const secPath of secretPathList) {
      if (secPath.includes(':')) {
        if (options.export) {
          output = 'export ';
        }

        const [, vaultName, secretName, glob, variableName] = secPath.match(
          binUtils.pathRegex,
        )!;

        if (glob) {
          vaultMessage.setName(vaultName);

          const secretListGenerator = grpcClient.vaultsListSecrets(
            vaultMessage,
            meta,
          );

          for await (const secret of secretListGenerator) {
            const sec = secret.getName();
            if (sec.includes(secretName))
            secrets.push(`${sec}`);
          }
        } else {
          secrets.push(secretName);
        }

        for (const secName of secrets) {
          vaultMessage.setName(vaultName);
          vaultSpecificMessage.setVault(vaultMessage);
          vaultSpecificMessage.setName(secName);
          const res = await grpcClient.vaultsGetSecret(vaultSpecificMessage, meta);
          const secret = res.getName();
          const varName = variableName ?? path.basename(secName.toUpperCase().replace('-', '_'));
          secretEnv[varName] = secret;

          data.push(output + `${varName}=${secret}`);
        }
        output = '';
        secrets = [];
      } else if (secPath === '-e' || secPath === '--export') {
        output += 'export ';
      } else {
        throw new CLIErrors.ErrorSecretPathFormat();
      }
    }

    if(shellCommand) {
      binUtils.spawnShell(shellCommand, secretEnv, options.format);
    } else {
      process.stdout.write(
        binUtils.outputFormatter({
          type: options.format === 'json' ? 'json' : 'list',
          data: data,
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

export default commandSecretEnv;
