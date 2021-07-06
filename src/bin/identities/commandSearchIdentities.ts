import { errors } from '../../grpc';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { clientPB } from '../../client';
import PolykeyClient from '../../PolykeyClient';
import { createCommand, outputFormatter } from '../utils';
import * as utils from '../../utils';

const commandTrustGestalts = createCommand('search', {
  description: {
    description: 'Searches a provider for any connected identities.',
    args: {
      providerId: 'The provider to search on',
    },
  },
  nodePath: true,
  verbose: true,
  format: true,
});

commandTrustGestalts.arguments('<providerId>');
commandTrustGestalts.action(async (providerId, options) => {
  const clientConfig = {};
  clientConfig['logger'] = new Logger('CLI Logger', LogLevel.WARN, [
    new StreamHandler(),
  ]);
  if (options.verbose) {
    clientConfig['logger'].setLevel(LogLevel.DEBUG);
  }
  clientConfig['nodePath'] = options.nodePath
    ? options.nodePath
    : utils.getDefaultNodePath();

  const client = new PolykeyClient(clientConfig);
  try {
    await client.start({});
    const grpcClient = client.grpcClient;
    const providerMessage = new clientPB.ProviderMessage();
    providerMessage.setId(providerId);

    const res = await grpcClient.identitiesGetInfo(
      providerMessage,
      await client.session.createJWTCallCredentials(),
    );

    process.stdout.write(
      outputFormatter({
        type: options.format === 'json' ? 'json' : 'list',
        data: [`Found identity: ${res.getId()}:${res.getMessage()}`],
      }),
    );
  } catch (err) {
    if (err instanceof errors.ErrorGRPCClientTimeout) {
      process.stderr.write(`${err.message}\n`);
    }
    if (err instanceof errors.ErrorGRPCServerNotStarted) {
      process.stderr.write(`${err.message}\n`);
    } else {
      process.stdout.write(
        outputFormatter({
          type: options.format === 'json' ? 'json' : 'list',
          data: ['Error:', err.message],
        }),
      );
    }
    throw err;
  } finally {
    client.stop();
  }
});

export default commandTrustGestalts;
