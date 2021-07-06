import type { NodeManager } from '../nodes';
import type { IdentitiesManager } from '../identities';
import type { GestaltGraph } from '../gestalts';
import type { SessionManager } from '../session';
import type {
  IdentityId,
  ProviderId,
  TokenData,
  IdentityInfo,
} from '../identities/types';

import * as grpc from '@grpc/grpc-js';

import * as clientPB from '../proto/js/Client_pb';

import * as grpcUtils from '../grpc/utils';
import { utils as gestaltsUtils } from '../gestalts';
import { NodeInfo } from '@/nodes/types';
import * as utils from '@/client/utils';
import git from 'isomorphic-git';

const createIdentitiesRPC = ({
  identitiesManager,
  nodeManager,
  gestaltGraph,
  sessionManager,
}: {
  identitiesManager: IdentitiesManager;
  nodeManager: NodeManager;
  gestaltGraph: GestaltGraph;
  sessionManager: SessionManager;
}) => {
  return {
    identitiesAuthenticate: async (
      call: grpc.ServerWritableStream<
        clientPB.ProviderMessage,
        clientPB.ProviderMessage
      >,
    ): Promise<void> => {
      const genWritable = grpcUtils.generatorWritable(call);
      const response = new clientPB.ProviderMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const provider = identitiesManager.getProvider(
          call.request.getId() as ProviderId,
        );
        const authFlow = provider?.authenticate();
        const userCode = (await authFlow?.next())?.value;
        if (typeof userCode != 'string') {
          throw new Error('userCode was not a string');
        }
        response.setMessage(userCode);
        response.setId('asd');
        await genWritable.next(response);

        //Wait to finish.
        const userName = (await authFlow?.next())?.value;
        if (!userName) throw Error('Failed to authenticate.');
        response.setMessage(userName);
        await genWritable.next(response);
        await genWritable.next(null);
      } catch (err) {
        await genWritable.throw(err);
      }
    },
    tokensPut: async (
      call: grpc.ServerUnaryCall<
        clientPB.TokenSpecificMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const provider = call.request.getProvider();
        await identitiesManager.putToken(
          provider?.getId() as ProviderId,
          provider?.getMessage() as IdentityId,
          { accessToken: call.request.getToken() } as TokenData,
        );
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    tokensGet: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.TokenMessage
      >,
      callback: grpc.sendUnaryData<clientPB.TokenMessage>,
    ): Promise<void> => {
      const response = new clientPB.TokenMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const tokens = await identitiesManager.getToken(
          call.request.getId() as ProviderId,
          call.request.getMessage() as IdentityId,
        );
        response.setToken(JSON.stringify(tokens));
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    tokensDelete: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      const response = new clientPB.EmptyMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        await identitiesManager.delToken(
          call.request.getId() as ProviderId,
          call.request.getMessage() as IdentityId,
        );
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    providersGet: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.ProviderMessage
      >,
      callback: grpc.sendUnaryData<clientPB.ProviderMessage>,
    ): Promise<void> => {
      const response = new clientPB.ProviderMessage();
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const providers = identitiesManager.getProviders();
        response.setId(JSON.stringify(Object.keys(providers)));
      } catch (err) {
        callback(grpcUtils.fromError(err), response);
      }
      callback(null, response);
    },
    identitiesGetConnectedInfos: async (
      call: grpc.ServerWritableStream<
        clientPB.ProviderSearchMessage,
        clientPB.IdentityInfoMessage
      >,
    ): Promise<void> => {
      const genWritable = grpcUtils.generatorWritable(call);
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const providerId = call.request.getProvider()?.getId() as ProviderId;
        const identityId = call.request
          .getProvider()
          ?.getMessage() as IdentityId;
        const provider = identitiesManager.getProvider(providerId);
        if (!provider)
          throw Error(
            `Provider id: ${providerId} is invalid or provider doesn't exist.`,
          );

        const identities = provider.getConnectedIdentityDatas(
          identityId,
          call.request.getSearchTermList(),
        );

        for await (const identity of identities) {
          const identityInfoMessage = new clientPB.IdentityInfoMessage();
          const providerMessage = new clientPB.ProviderMessage();
          providerMessage.setId(identity.providerId);
          providerMessage.setMessage(identity.identityId);
          identityInfoMessage.setProvider(providerMessage);
          identityInfoMessage.setName(identity.name ?? '');
          identityInfoMessage.setEmail(identity.email ?? '');
          identityInfoMessage.setUrl(identity.url ?? '');
          await genWritable.next(identityInfoMessage);
        }
        await genWritable.next(null);
      } catch (err) {
        await genWritable.throw(err);
      }
    },
    /**
     * gets the first identityId of the local keynode.
     */
    identitiesGetInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.ProviderMessage
      >,
      callback: grpc.sendUnaryData<clientPB.ProviderMessage>,
    ): Promise<void> => {
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        // Get's an identity out of all identities.
        const providerMessage = new clientPB.ProviderMessage();
        const providerId = call.request.getId() as ProviderId;
        const provider = identitiesManager.getProvider(providerId);
        if (!provider) throw Error(`Invalid provider: ${providerId}`);
        const identities = await provider.getAuthIdentityIds();
        if (identities.length != 0) {
          providerMessage.setId(providerId);
          providerMessage.setMessage(identities[0]);
        } else throw Error(`No identities found for provider: ${providerId}`);
        callback(null, providerMessage);
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
    },
    /**
     * Augments the keynode with a new identity.
     */
    identitiesAugmentKeynode: async (
      call: grpc.ServerUnaryCall<
        clientPB.ProviderMessage,
        clientPB.EmptyMessage
      >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      // To augment a keynode we need a provider, generate an oauthkey and then
      const info = call.request;
      try {
        await utils.verifyToken(call.metadata, sessionManager);
        const nodeId = nodeManager.getNodeId(); //Getting the local node ID.

        //Do the deed...
        const nodeInfo: NodeInfo = {
          id: nodeId,
          chain: {},
        };
        const identityInfo: IdentityInfo = {
          providerId: info.getId() as ProviderId,
          identityId: info.getMessage() as IdentityId,
          claims: {},
        };
        await gestaltGraph.linkNodeAndIdentity(nodeInfo, identityInfo); //Need to call this
        // it takes NodeInfo and IdentityInfo.
        // Getting and creating NodeInfo is blocked by
      } catch (err) {
        callback(grpcUtils.fromError(err), null);
      }
      const emptyMessage = new clientPB.EmptyMessage();
      callback(null, emptyMessage);
    },
  };
};

export default createIdentitiesRPC;
