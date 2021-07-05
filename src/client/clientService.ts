import { promisify } from 'util';
import * as grpc from '@grpc/grpc-js';

import { KeyManager } from '../keys';
import { NodeManager } from '../nodes';
import { VaultManager } from '../vaults';
import { GestaltGraph } from '../gestalts';
import { SessionManager } from '../session';
import { IdentitiesManager } from '../identities';
import { GitManager } from '../git';

import { ClientService, IClientServer } from '../proto/js/Client_grpc_pb';

import * as clientPB from '../proto/js/Client_pb';

import createEchoRPC from './rpcEcho';
import createVaultRPC from './rpcVaults';
import createKeysRPC from './rpcKeys';
import createNodeRPC from './rpcNodes';
import createGestaltRPC from './rpcGestalts';
import createIdentitiesRPC from './rpcIdentities';

/**
 * Creates the client service for use with a GRPCServer
 * @param domains An object representing all the domains / managers the client server uses.
 * @returns an IClientServer object
 */
function createClientService({
  keyManager,
  vaultManager,
  nodeManager,
  identitiesManager,
  gestaltGraph,
  gitManager,
  sessionManager,
}: {
  keyManager: KeyManager;
  vaultManager: VaultManager;
  nodeManager: NodeManager;
  identitiesManager: IdentitiesManager;
  gestaltGraph: GestaltGraph;
  gitManager: GitManager;
  sessionManager: SessionManager;
}) {
  const clientService: IClientServer = {
    ...createEchoRPC(),
    ...createVaultRPC({
      vaultManager: vaultManager,
      gitManager: gitManager,
      sessionManager: sessionManager,
    }),
    ...createKeysRPC({
      keyManager: keyManager,
      sessionManager: sessionManager,
    }),
    ...createNodeRPC({nodeManager: nodeManager}),
    ...createIdentitiesRPC({ identitiesManager: identitiesManager }),
    ...createGestaltRPC({ gestaltGraph: gestaltGraph }),
    nodesList: async (
      call: grpc.ServerWritableStream<
        clientPB.EmptyMessage,
        clientPB.NodeMessage
      >,
    ): Promise<void> => {
      // call.request // PROCESS THE REQEUST MESSAGE
      const nodeMessage = new clientPB.NodeMessage();
      nodeMessage.setName('some node name');
      const write = promisify(call.write).bind(call);
      await write(nodeMessage);
      call.end();
    },
    gestaltSync: async (
      call: grpc.ServerDuplexStream<
        clientPB.GestaltMessage,
        clientPB.GestaltMessage
      >,
    ): Promise<void> => {
      // it is readable
      // and writable
      // AT THE SAME TIME!
      // that means you can do a dual wrap
      const gestaltMessage = new clientPB.GestaltMessage();
      gestaltMessage.setName('some gestalt name');
      const write = promisify(call.write).bind(call);
      await write(gestaltMessage);
      call.end();
    },
  };

  return clientService;
}

export default createClientService;

export { ClientService };
