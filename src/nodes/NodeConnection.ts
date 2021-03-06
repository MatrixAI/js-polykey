import { agentPB, GRPCClientAgent } from '@/agent';
import type { NodeId, NodeData } from './types';
import type { Host, Port, ProxyConfig } from '../network/types';

import Logger from '@matrixai/logger';
import * as nodeUtils from './utils';
import * as networkUtils from '../network/utils';
import * as nodeErrors from './errors';
import { NodeAddressMessage } from '@/proto/js/Agent_pb';
import { ForwardProxy } from '../network';
import { KeyManager } from '@/keys';

/**
 * Encapsulates the unidirectional client-side connection of one node to another.
 */
class NodeConnection {
  protected _started: boolean = false;
  protected logger: Logger;
  protected keyManager: KeyManager;

  // Node ID, host, and port of the target node at the end of this connection
  protected targetNodeId: NodeId;
  protected ingressHost: Host;
  protected ingressPort: Port;

  // Host and port of the initiating node (client) where the connection begins
  protected localNodeId: NodeId;
  protected localHost: Host;
  protected localPort: Port;

  protected fwdProxy: ForwardProxy;
  protected proxyConfig: ProxyConfig;
  protected client: GRPCClientAgent;

  constructor({
    sourceNodeId,
    targetNodeId,
    targetHost,
    targetPort,
    forwardProxy,
    keyManager,
    logger,
  }: {
    sourceNodeId: NodeId;
    targetNodeId: NodeId;
    targetHost: Host;
    targetPort: Port;
    forwardProxy: ForwardProxy;
    keyManager: KeyManager;
    logger?: Logger;
  }) {
    this.logger = logger ?? new Logger('NodeConnection');
    this.localNodeId = sourceNodeId;
    this.targetNodeId = targetNodeId;
    this.ingressHost = targetHost;
    this.ingressPort = targetPort;
    this.fwdProxy = forwardProxy;
    this.keyManager = keyManager;

    this.proxyConfig = {
      host: this.fwdProxy.getProxyHost(),
      port: this.fwdProxy.getProxyPort(),
      authToken: this.fwdProxy.authToken,
    } as ProxyConfig;
    this.client = new GRPCClientAgent({
      nodeId: targetNodeId,
      host: targetHost,
      port: targetPort,
      proxyConfig: this.proxyConfig,
      logger: logger ?? new Logger('NodeConnectionClient'),
    });
  }

  /**
   * Initialises and starts the connection (via the fwdProxy).
   *
   * @param brokerConnections map of all established broker connections
   * If not provided, it's assumed a direct connection can be made to the target
   * (i.e. without hole punching), as the broker nodes relay the hole punch message.
   */
  public async start({
    brokerConnections = new Map<NodeId, NodeConnection>(),
  }: {
    brokerConnections?: Map<NodeId, NodeConnection>;
  }) {
    this.logger.info('Starting NodeConnection');

    // 1. Get the egress port of the fwdProxy (used for hole punching)
    const egressAddress = networkUtils.buildAddress(
      this.fwdProxy.getEgressHost() as Host,
      this.fwdProxy.getEgressPort() as Port,
    );
    // Also need to sign this for authentication (i.e. from expected source)
    const signature = await this.keyManager.signWithRootKeyPair(
      Buffer.from(egressAddress),
    );
    // 2. Ask fwdProxy for connection to target (the revProxy of other node)
    // 3. Relay the egress port to the broker/s (such that they can inform the other node)
    // 4. Start sending hole-punching packets to other node (done in openConnection())
    // Done in parallel
    await Promise.all([
      this.fwdProxy.openConnection(
        this.targetNodeId,
        this.ingressHost,
        this.ingressPort,
      ),
      brokerConnections.forEach((conn: NodeConnection) => {
        conn.sendHolePunchMessage(
          this.localNodeId,
          this.targetNodeId,
          egressAddress,
          signature,
        );
      }),
    ]);
    // 5. When finished, you have a connection to other node
    // Then you can create/start the GRPCClient, and perform the request
    await this.client.start({});
    this._started = true;
    this.logger.info('Started NodeConnection');
  }

  public async stop() {
    await this.client.stop();
    await this.fwdProxy.closeConnection(this.ingressHost, this.ingressPort);
  }

  public getClient() {
    return this.client;
  }

  /**
   * Performs a GRPC request to retrieve the closest nodes relative to the given
   * target node ID.
   * @param targetNodeId the node ID to find other nodes closest to it
   * @returns list of nodes and their IP/port that are closest to the target
   */
  public async getClosestNodes(targetNodeId: NodeId): Promise<Array<NodeData>> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeConnectionNotStarted();
    }
    // Construct the message
    const nodeIdMessage = new agentPB.NodeIdMessage();
    nodeIdMessage.setNodeid(targetNodeId);
    // Send through client
    const response = await this.client.getClosestLocalNodes(nodeIdMessage);
    const nodes: Array<NodeData> = [];
    // Loop over each map element (from the returned response) and populate nodes
    response
      .getNodetableMap()
      .forEach((address: NodeAddressMessage, nodeId: string) => {
        nodes.push({
          id: nodeId as NodeId,
          address: {
            ip: address.getIp() as Host,
            port: address.getPort() as Port,
          },
          distance: nodeUtils.calculateDistance(targetNodeId, nodeId as NodeId),
        });
      });
    return nodes;
  }

  /**
   * Performs a GRPC request to send a hole-punch message to the target. Used to
   * initially establish the NodeConnection from source to target.
   *
   * @param sourceNodeId node ID of the current node (i.e. the sender)
   * @param targetNodeId node ID of the target node to hole punch
   * @param egressAddress stringified address of `egressHost:egressPort`
   * @param signature signature to verify source node is sender (signature based
   * on egressAddress as message)
   */
  public async sendHolePunchMessage(
    sourceNodeId: NodeId,
    targetNodeId: NodeId,
    egressAddress: string,
    signature: Buffer,
  ): Promise<void> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeConnectionNotStarted();
    }
    const relayMsg = new agentPB.RelayMessage();
    relayMsg.setSrcid(sourceNodeId);
    relayMsg.setTargetid(targetNodeId);
    relayMsg.setEgressaddress(egressAddress);
    relayMsg.setSignature(signature.toString());
    await this.client.sendHolePunchMessage(relayMsg);
  }
}

export default NodeConnection;
