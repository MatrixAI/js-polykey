import type { NodeId, NodeInfo } from '../nodes/types';
import type { GestaltGraph } from '../gestalts';
import type { GestaltKey } from '../gestalts/types';
import type {
  IdentityInfo,
  ProviderId,
  IdentityId,
  IdentityClaimId,
  IdentityClaims,
} from '../identities/types';
import type { NodeManager } from '../nodes';
import type { Provider, IdentitiesManager } from '../identities';
import type { Claim, ClaimId, ClaimLinkIdentity } from '../claims/types';

import Logger from '@matrixai/logger';
import * as gestaltsUtils from '../gestalts/utils';
import * as claimsUtils from '../claims/utils';
import { errors as identitiesErrors } from '../identities';
import { errors as nodesErrors } from '../nodes';
import { errors as gestaltsErrors } from '../gestalts';

class Discovery {
  protected gestaltGraph: GestaltGraph;
  protected identitiesManager: IdentitiesManager;
  protected nodeManager: NodeManager;
  protected logger: Logger;
  protected _started: boolean = false;

  constructor({
    gestaltGraph,
    identitiesManager,
    nodeManager,
    logger,
  }: {
    gestaltGraph: GestaltGraph;
    identitiesManager: IdentitiesManager;
    nodeManager: NodeManager;
    logger?: Logger;
  }) {
    this.gestaltGraph = gestaltGraph;
    this.identitiesManager = identitiesManager;
    this.nodeManager = nodeManager;
    this.logger = logger ?? new Logger(this.constructor.name);
  }

  get started(): boolean {
    return this._started;
  }

  public async start(): Promise<void> {
    try {
      if (this._started) {
        return;
      }
      this.logger.info('Starting Discovery');
      this._started = true;
      if (!this.gestaltGraph.started) {
        throw new gestaltsErrors.ErrorGestaltsGraphNotStarted();
      }
      if (!this.identitiesManager.started) {
        throw new identitiesErrors.ErrorIdentitiesManagerNotStarted();
      }
      if (!this.nodeManager.started) {
        throw new nodesErrors.ErrorNodeManagerNotStarted();
      }
      this.logger.info('Started Discovery');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  public async stop() {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping Discovery');
    this._started = false;
    this.logger.info('Stopped Discovery');
  }

  public discoverGestaltByNode(nodeId: NodeId) {
    const nodeKey = gestaltsUtils.keyFromNode(nodeId);
    return this.discoverGestalt(nodeKey);
  }

  public discoverGestaltByIdentity(
    providerId: ProviderId,
    identityId: IdentityId,
  ): AsyncGenerator<void, void, void> {
    const identityKey = gestaltsUtils.keyFromIdentity(providerId, identityId);
    return this.discoverGestalt(identityKey);
  }

  protected async *discoverGestalt(
    gK: GestaltKey,
  ): AsyncGenerator<void, void, void> {
    const vertexQueue = [gK];
    const visitedVertices = new Set();

    while (true) {
      // Get the next vertex discovered to be in the gestalt
      const vertex = vertexQueue.shift();
      if (!vertex) {
        break;
      }

      const vertexGId = gestaltsUtils.ungestaltKey(vertex);
      if (vertexGId.type == 'node') {
        // If the next vertex is a node, find its cryptolinks
        // const linkInfos = await this.nodeManager.getCryptolinks(nodeInfo.id);
        //  need some public API to:
        //  1. create connection
        //  2. get certificate chain (eventually sigchain)
        //  3. get the cryptolinks
        //  If cannot create connection, then throw some kind of exception
        //  User display = "Cannot crawl gestalt graph. Please try again later"

        // Get the verified chain data of this node (contains all cryptolinks)
        const vertexChainData = await this.nodeManager.requestChainData(
          vertexGId.nodeId,
        );

        // TODO: for now, the chain data is treated as a 'disjoint' set of
        // cryptolink claims from a node to another node/identity
        // That is, we have no notion of revokations, or multiple claims to the
        // same node/identity. Thus, we simply iterate over this chain of
        // cryptolinks.

        // Now have the NodeInfo of this vertex
        const vertexNodeInfo: NodeInfo = {
          id: vertexGId.nodeId,
          chain: vertexChainData,
        };

        // Iterate over each of the claims in the chain (already verified)
        // TODO: because we're iterating over keys in a record, I don't believe
        // that this will iterate in lexicographical order of keys. For now,
        // this doesn't matter though (because of the previous comment).
        for (const claimId in vertexChainData) {
          const claim: Claim = vertexChainData[claimId as ClaimId];

          // If the claim is to a node
          if (claim.payload.data.type == 'node') {
            // Get the chain data of the linked node
            const linkedVertexNodeId = claim.payload.data.node2;
            const linkedVertexChainData =
              await this.nodeManager.requestChainData(linkedVertexNodeId);
            // With this verified chain, we can link
            const linkedVertexNodeInfo: NodeInfo = {
              id: linkedVertexNodeId,
              chain: linkedVertexChainData,
            };
            await this.gestaltGraph.linkNodeAndNode(
              vertexNodeInfo,
              linkedVertexNodeInfo,
            );

            // Add this vertex to the queue if it hasn't already been visited
            const linkedVertexGK =
              gestaltsUtils.keyFromNode(linkedVertexNodeId);
            if (!visitedVertices.has(linkedVertexGK)) {
              vertexQueue.push(linkedVertexGK);
            }
          }

          // If the claim is to an identity
          if (claim.payload.data.type == 'identity') {
            // Attempt to get the identity info on the identity provider
            const identityInfo = await this.getIdentityInfo(
              claim.payload.data.provider,
              claim.payload.data.identity,
              claim.payload.data.identity,
            );
            // If we can't get identity info, simply skip this claim
            if (!identityInfo) {
              continue;
            }
            // Link the node to the found identity info
            await this.gestaltGraph.linkNodeAndIdentity(
              vertexNodeInfo,
              identityInfo,
            );

            // Add this identity vertex to the queue if it hasn't already been visited
            const linkedIdentityGK = gestaltsUtils.keyFromIdentity(
              claim.payload.data.provider,
              claim.payload.data.identity,
            );
            if (!visitedVertices.has(linkedIdentityGK)) {
              vertexQueue.push(linkedIdentityGK);
            }
          }
        }
      } else if (vertexGId.type == 'identity') {
        // If the next vertex is an identity, perform a social discovery
        // Firstly get the identity info of this identity
        const vertexIdentityInfo = await this.getIdentityInfo(
          vertexGId.providerId,
          vertexGId.identityId,
          vertexGId.identityId,
        );
        // If we don't have identity info, simply skip this vertex
        if (!vertexIdentityInfo) {
          continue;
        }

        // Link the identity with each node from its claims on the provider
        // Iterate over each of the claims
        for (const id in vertexIdentityInfo.claims) {
          const identityClaimId = id as IdentityClaimId;
          const claim = vertexIdentityInfo.claims[identityClaimId];
          // Claims on an identity provider will always be node -> identity
          // So just cast payload data as such
          const data = claim.payload.data as ClaimLinkIdentity;
          const linkedVertexNodeId = data.node;
          // Get the chain data of this claimed node (so that we can link in GG)
          const linkedVertexChainData = await this.nodeManager.requestChainData(
            linkedVertexNodeId,
          );
          // With this verified chain, we can link
          const linkedVertexNodeInfo: NodeInfo = {
            id: linkedVertexNodeId,
            chain: linkedVertexChainData,
          };
          await this.gestaltGraph.linkNodeAndIdentity(
            linkedVertexNodeInfo,
            vertexIdentityInfo,
          );

          // Add this vertex to the queue if it hasn't already been visited
          const linkedVertexGK = gestaltsUtils.keyFromNode(linkedVertexNodeId);
          if (!visitedVertices.has(linkedVertexGK)) {
            vertexQueue.push(linkedVertexGK);
          }
        }
      }
      yield;
    }
  }

  /**
   * Helper function to retrieve the IdentityInfo of an identity on a provider.
   * All claims in the returned IdentityInfo are verified by the node it claims
   * to link to.
   * Returns undefined if no identity info to be retrieved (either no provider
   * or identity data found).
   */
  protected async getIdentityInfo(
    providerId: ProviderId,
    identityId: IdentityId,
    authIdentityId: IdentityId,
  ): Promise<IdentityInfo | undefined> {
    const provider = this.identitiesManager.getProvider(providerId);
    // If we don't have this provider, no identity info to find
    if (!provider) {
      return undefined;
    }
    // Get the identity data
    const identityData = await provider.getIdentityData(identityId, identityId);
    // If we don't have identity data, no identity info to find
    if (!identityData) {
      return undefined;
    }
    // Get and verify the identity claims
    const identityClaims = await this.verifyIdentityClaims(
      provider,
      identityId,
      authIdentityId,
    );
    // With this verified set of claims, we can now link
    return {
      ...identityData,
      claims: identityClaims,
    } as IdentityInfo;
  }

  /**
   * Helper function to retrieve and verify the claims of an identity on a given
   * provider. Connects with each node the identity claims to be linked with,
   * and verifies the claim with the public key of the node.
   */
  protected async verifyIdentityClaims(
    provider: Provider,
    identityId: IdentityId,
    authIdentityId: IdentityId,
  ): Promise<IdentityClaims> {
    const identityClaims: IdentityClaims = {};
    for await (const claim of provider.getClaims(authIdentityId, identityId)) {
      const decodedClaim: Claim = {
        payload: claim.payload,
        signatures: claim.signatures,
      };
      // Claims on an identity provider will always be node -> identity
      // So just cast payload data as such
      const data = claim.payload.data as ClaimLinkIdentity;
      const encoded = await claimsUtils.encodeClaim(decodedClaim);
      // Verify the claim with the public key of the node
      const verified = await claimsUtils.verifyClaimSignature(
        encoded,
        await this.nodeManager.getPublicKey(data.node),
      );
      // If verified, add to the record
      if (verified) {
        identityClaims[claim.id] = claim;
      }
    }
    return identityClaims;
  }
}

export default Discovery;