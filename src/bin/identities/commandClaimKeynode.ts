import { clientPB } from '../../client';
import { createCommand, outputFormatter } from '../utils';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import PolykeyClient from '@/PolykeyClient';
import { errors } from '@/grpc';
import * as utils from '../../utils';

const commandClaimKeynode = createCommand('claim', {
  description: {
    description: 'Claim an identity for this keynode.',
    args: {
      providerId: 'Provider that identity is linked to',
      identityId: 'Identitiy to augment the keynode with',
    },
  },
  verbose: true,
  format: true,
  nodePath: true,
});
commandClaimKeynode.arguments('<providerId> <identityId>');
commandClaimKeynode.alias('aug');
commandClaimKeynode.action(async (providerId, identitiyId, options) => {
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
    //starting client
    await client.start({});
    const grpcClient = client.grpcClient;

    //constructing message.
    const providerMessage = new clientPB.ProviderMessage();
    providerMessage.setId(providerId);
    providerMessage.setMessage(identitiyId);

    //sending message.
    await grpcClient.identitiesAugmentKeynode(
      providerMessage,
      await client.session.createJWTCallCredentials(),
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

export default commandClaimKeynode;
