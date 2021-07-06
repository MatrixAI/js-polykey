import type { Gestalt, GestaltAction } from '../gestalts/types';
import type { NodeId, NodeInfo } from '../nodes/types';
import type { IdentityId, IdentityInfo, ProviderId } from '../identities/types';
import type { GestaltGraph } from '../gestalts';
import type { NodeManager } from '../nodes';
import type { SessionManager } from '../session';
import type Discovery from '../discovery/Discovery';

import * as grpc from '@grpc/grpc-js';
import * as clientPB from '../proto/js/Client_pb';
import { promisify } from '../utils';
import { ErrorGestaltsInvalidAction } from '@/gestalts/errors';
import { checkGestaltAction, validGestaltAction } from '../gestalts/utils';
import * as utils from '../client/utils';
import * as grpcUtils from '../grpc/utils';

const createGestaltsRPC = ({
  gestaltGraph,
  nodeManager,
  sessionManager,
  discovery,
}: {
  gestaltGraph: GestaltGraph;
  nodeManager: NodeManager;
  sessionManager: SessionManager;
  discovery: Discovery;
}) => {
  return {
    gestaltsGetNode: async (
      call: grpc.ServerUnaryCall<clientPB.NodeMessage, clientPB.GestaltMessage>,
      callback: grpc.sendUnaryData<clientPB.GestaltMessage>,
    ): Promise<void> => {
      const response = new clientPB.GestaltMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const gestalt = await gestaltGraph.getGestaltByNode(
          call.request.getName() as NodeId,
        );
        if (gestalt) {
          response.setName(JSON.stringify(gestalt));
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    gestaltsGetIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.GestaltMessage
      >,
      callback: grpc.sendUnaryData<clientPB.GestaltMessage>,
    ): Promise<void> => {
      const response = new clientPB.GestaltMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const gestalt = await gestaltGraph.getGestaltByIdentity(
          call.request.getId() as ProviderId,
          call.request.getMessage() as IdentityId,
        );
        if (gestalt) {
          response.setName(JSON.stringify(gestalt));
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    gestaltsList: async (
      call: grpc.ServerWritableStream<
        clientPB.EmptyMessage,
        clientPB.GestaltMessage
      >,
    ): Promise<void> => {
      const genWritable = grpcUtils.generatorWritable(call);
      let gestaltMessage: clientPB.GestaltMessage;
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const certs: Array<Gestalt> = await gestaltGraph.getGestalts();
        for (const cert of certs) {
          gestaltMessage = new clientPB.GestaltMessage();
          gestaltMessage.setName(JSON.stringify(cert));
          await genWritable.next(gestaltMessage);
        }
        await genWritable.next(null);
      } catch (err) {
        await genWritable.throw(err);
      }
    },
    gestaltsSetNode: async (
      call: grpc.ServerUnaryCall<
        clientPB.GestaltTrustMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        // constructing node info:
        const nodeInfo: NodeInfo = {
          id: info.getName() as NodeId,
          chain: {},
        };
        const nodeId = nodeManager.getNodeId();
        const keyNodeInfo: NodeInfo = {
          id: nodeId,
          chain: {},
        };
        if (info.getSet()) {
          //linking to keynode.
          await gestaltGraph.setNode(nodeInfo);
          await gestaltGraph.linkNodeAndNode(nodeInfo, keyNodeInfo);
        } else {
          //Unlinking from keynode.
          await gestaltGraph.unlinkNodeAndNode(nodeId, nodeInfo.id);
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      const emptyMessage = new clientPB.EmptyMessage();
      callback(null, emptyMessage);
    },
    gestaltsSetIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.GestaltTrustMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //constructing identity info.
        const identityInfo: IdentityInfo = {
          providerId: info.getProvider() as ProviderId,
          identityId: info.getName() as IdentityId,
          claims: {},
        };
        const nodeId = nodeManager.getNodeId();
        if (info.getSet()) {
          //linking to keynode.
          await gestaltGraph.setIdentity(identityInfo);
          const nodeInfo: NodeInfo = {
            id: nodeId,
            chain: {},
          };
          await gestaltGraph.linkNodeAndIdentity(nodeInfo, identityInfo);
        } else {
          //Unlinking from keynode.
          await gestaltGraph.unlinkNodeAndIdentity(
            nodeId,
            identityInfo.providerId,
            identityInfo.identityId,
          );
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      const emptyMessage = new clientPB.EmptyMessage();
      callback(null, emptyMessage);
    },
    gestaltsDiscoverNode: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const emptyMessage = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //constructing identity info.
        const gen = discovery.discoverGestaltByNode(info.getName() as NodeId);
        for await (const val of gen){}
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, emptyMessage);
    },
    gestaltsDiscoverIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const emptyMessage = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //constructing identity info.
        const gen = discovery.discoverGestaltByIdentity(
          info.getId() as ProviderId,
          info.getMessage() as IdentityId
          );
        for await (const val of gen){}
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, emptyMessage);
    },
    gestaltsGetActionsByNode: async (
      call: grpc.ServerUnaryCall<clientPB.NodeMessage, clientPB.ActionsMessage>,
      callback: grpc.sendUnaryData<clientPB.ActionsMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.ActionsMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const result = await gestaltGraph.getGestaltActionsByNode(
          info.getName() as NodeId,
        );
        if (result == undefined) {
          // Node doesn't exist, so no permissions. might throw error instead TBD.
          response.setActionList([]);
        } else {
          // Contains permission
          const actions = Object.keys(result);
          response.setActionList(actions);
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
    gestaltsGetActionsByIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.ActionsMessage
      >,
      callback: grpc.sendUnaryData<clientPB.ActionsMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.ActionsMessage();
      try {
        console.log('Aasdasd', utils);
        await utils.verifyToken(call.metadata, sessionManager);
        const providerId = info.getId() as ProviderId;
        const identityId = info.getMessage() as IdentityId;
        const result = await gestaltGraph.getGestaltActionsByIdentity(
          providerId,
          identityId,
        );
        if (result == undefined) {
          // Node doesn't exist, so no permissions. might throw error instead TBD.
          response.setActionList([]);
        } else {
          // Contains permission
          const actions = Object.keys(result);
          response.setActionList(actions);
        }
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
    gestaltsSetActionByNode: async (
      call: grpc.ServerUnaryCall<
        clientPB.SetActionsMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //checking
        switch (info.getNodeOrProviderCase()) {
          default:
          case clientPB.SetActionsMessage.NodeOrProviderCase
            .NODE_OR_PROVIDER_NOT_SET:
          case clientPB.SetActionsMessage.NodeOrProviderCase.IDENTITY:
            throw Error('Node message not set.');
          case clientPB.SetActionsMessage.NodeOrProviderCase.NODE:
            break; //This is fine.
        }

        //Setting the action.
        const action = info.getAction() as GestaltAction;
        checkGestaltAction(action);
        const nodeId = info.getNode()?.getName() as NodeId;
        await gestaltGraph.setGestaltActionByNode(nodeId, action);
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
    gestaltsSetActionByIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.SetActionsMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //checking
        switch (info.getNodeOrProviderCase()) {
          default:
          case clientPB.SetActionsMessage.NodeOrProviderCase.NODE:
          case clientPB.SetActionsMessage.NodeOrProviderCase
            .NODE_OR_PROVIDER_NOT_SET:
            throw Error('Identity message not set.');
          case clientPB.SetActionsMessage.NodeOrProviderCase.IDENTITY:
            break; //This is fine.
        }

        //Setting the action.
        const action = info.getAction() as GestaltAction;
        checkGestaltAction(action);
        const providerId = info.getIdentity()?.getId() as ProviderId;
        const identityId = info.getIdentity()?.getMessage() as IdentityId;
        await gestaltGraph.setGestaltActionByIdentity(
          providerId,
          identityId,
          action,
        );
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
    gestaltsUnsetActionByNode: async (
      call: grpc.ServerUnaryCall<
        clientPB.SetActionsMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //checking
        switch (info.getNodeOrProviderCase()) {
          default:
          case clientPB.SetActionsMessage.NodeOrProviderCase
            .NODE_OR_PROVIDER_NOT_SET:
          case clientPB.SetActionsMessage.NodeOrProviderCase.IDENTITY:
            throw Error('Node message not set.');
          case clientPB.SetActionsMessage.NodeOrProviderCase.NODE:
            break; //This is fine.
        }

        //Setting the action.
        const action = info.getAction() as GestaltAction;
        checkGestaltAction(action);
        const nodeId = info.getNode()?.getName() as NodeId;
        await gestaltGraph.unsetGestaltActionByNode(nodeId, action);
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
    gestaltsUnsetActionByIdentity: async (
      call: grpc.ServerUnaryCall<
        clientPB.SetActionsMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const info = call.request;
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        //checking
        switch (info.getNodeOrProviderCase()) {
          default:
          case clientPB.SetActionsMessage.NodeOrProviderCase.NODE:
          case clientPB.SetActionsMessage.NodeOrProviderCase
            .NODE_OR_PROVIDER_NOT_SET:
            throw Error('Identity message not set.');
          case clientPB.SetActionsMessage.NodeOrProviderCase.IDENTITY:
            break; //This is fine.
        }

        //Setting the action.
        const action = info.getAction() as GestaltAction;
        checkGestaltAction(action);
        const providerId = info.getIdentity()?.getId() as ProviderId;
        const identityId = info.getIdentity()?.getMessage() as IdentityId;
        await gestaltGraph.unsetGestaltActionByIdentity(
          providerId,
          identityId,
          action,
        );
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      callback(null, response);
    },
  };
};

export default createGestaltsRPC;
