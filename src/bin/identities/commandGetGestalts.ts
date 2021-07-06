import { errors } from '../../grpc';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { clientPB } from '../../client';
import PolykeyClient from '../../PolykeyClient';
import { createCommand, outputFormatter } from '../utils';
import * as utils from '../../utils';

const commandGetGestalts = createCommand('get', {
  description: {
    description:
      'Gets a gestalt with a node id or identity from the gestalt graph',
    args: {
      Id: 'NodeId or identityId to search for in gestalt graph',
      providerId: 'Provider Id to search for in gestalt graph (provider:id)',
    },
  },
  nodePath: true,
  verbose: true,
  format: true,
});
commandGetGestalts.arguments('<id>');
commandGetGestalts.option(
  '-i, --identity <providerId>',
  'Flags using an identity, sets providerId',
);
commandGetGestalts.action(async (id, options) => {
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

    let res: clientPB.GestaltMessage;

    if (!options.identity) {
      //getting from node.
      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(id);
      res = await grpcClient.gestaltsGetNode(
        nodeMessage,
        await client.session.createJWTCallCredentials(),
      );
    } else {
      //Getting from identity.
      const providerMessage = new clientPB.ProviderMessage();
      providerMessage.setId(options.identity);
      providerMessage.setMessage(id);
      res = await grpcClient.gestaltsGetIdentitiy(
        providerMessage,
        await client.session.createJWTCallCredentials(),
      );
    }
    const gestalt = JSON.parse(res.getName());
    let output: any = gestalt;

    if (options.format !== 'json') {
      //Creating a list.
      output = [];
      //Listing nodes.
      for (const nodeKey of Object.keys(gestalt.nodes)) {
        const node = gestalt.nodes[nodeKey];
        output.push(`${node.id}`);
      }
      //Listing identities
      for (const identityKey of Object.keys(gestalt.identities)) {
        const identitiy = gestalt.identities[identityKey];
        output.push(`${identitiy.providerId}:${identitiy.identityId}`);
      }
    }

    process.stdout.write(
      outputFormatter({
        type: options.format === 'json' ? 'json' : 'list',
        data: output,
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

export default commandGetGestalts;
