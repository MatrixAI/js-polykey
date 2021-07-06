import { errors } from '../../grpc';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { clientPB } from '../../client';
import PolykeyClient from '../../PolykeyClient';
import { createCommand, outputFormatter } from '../utils';
import * as utils from '../../utils';

const commandListGestalts = createCommand('list', {
  description: {
    description: 'List all the gestalts in the gestalt graph',
    args: {},
  },
  aliases: ['ls'],
  nodePath: true,
  verbose: true,
  format: true,
});
commandListGestalts.action(async (options) => {
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
  const emptyMessage = new clientPB.EmptyMessage();
  let output: any;
  const gestalts: any = [];
  try {
    await client.start({});
    const grpcClient = client.grpcClient;

    const res = grpcClient.gestaltsList(
      emptyMessage,
      await client.session.createJWTCallCredentials(),
    );

    for await (const val of res) {
      const gestalt = JSON.parse(val.getName());
      const newGestalt: any = {
        permissions: [],
        nodes: [],
        identities: [],
      };
      for (const node of Object.keys(gestalt.nodes)) {
        const nodeInfo = gestalt.nodes[node];
        newGestalt.nodes.push({ id: nodeInfo.id });
      }
      for (const identity of Object.keys(gestalt.identities)) {
        const identityInfo = gestalt.identities[identity];
        newGestalt.identities.push({
          providerId: identityInfo.providerId,
          identityId: identityInfo.identityId,
        });
      }
      //Getting the permissions for the gestalt.
      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName(newGestalt.nodes[0].id);
      const actionsMessage = await grpcClient.gestaltsGetActionsByNode(
        nodeMessage,
        await client.session.createJWTCallCredentials(),
      );
      const actionList = actionsMessage.getActionList();
      if (actionList.length === 0) newGestalt.permissions = null;
      else newGestalt.permissions = actionList;
      gestalts.push(newGestalt);
    }
    output = gestalts;
    console.log('format: ', options.format);
    if (options.format !== 'json') {
      //Convert to a human readable list.
      output = [];
      let count = 1;
      for (const gestalt of gestalts) {
        output.push(`gestalt ${count}`);
        output.push(`permissions: ${gestalt.permissions ?? 'None'}`);

        //listing nodes
        for (const node of gestalt.nodes) {
          output.push(`${node.id}`);
        }
        //listing identities
        for (const identity of gestalt.identities) {
          output.push(`${identity.providerId}:${identity.identityId}`);
        }
        output.push('');
        count++;
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
    await client.stop();
  }
});

export default commandListGestalts;
