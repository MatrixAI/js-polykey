import type {
  NodeId,
  NodeAddress,
  NodeBucketIndex,
  NodeBucket,
  NodeData,
} from './types';
import type { Host, Port } from '../network/types';
import type { DB } from '../db';
import type { DBLevel, DBOp } from '../db/types';

import { Mutex } from 'async-mutex';
import lexi from 'lexicographic-integer';
import Logger from '@matrixai/logger';
import NodeManager from './NodeManager';
import * as nodeUtils from './utils';
import * as nodeErrors from './errors';
import { errors as dbErrors } from '../db';

/**
 * NodeGraph is an implementation of Kademlia for maintaining peer to peer information
 * We maintain a map of buckets. Where each bucket has k number of node infos
 */
class NodeGraph {
  // node id has 44 characters which is 352 bits
  public readonly nodeIdBits: number = 352;
  // max number of nodes in each k-bucket (a.k.a. k)
  public readonly maxNodesPerBucket: number = 20;
  // max parallel connections (a.k.a. alpha)
  public readonly maxConcurrentNodeConnections: number = 3;

  protected logger: Logger;
  protected db: DB;
  protected nodeManager: NodeManager;
  protected nodeId: NodeId;
  protected nodeGraphDbDomain: string = this.constructor.name;
  protected nodeGraphBucketsDbDomain: Array<string> = [
    this.nodeGraphDbDomain,
    'buckets',
  ];
  protected nodeGraphDb: DBLevel<string>;
  protected nodeGraphBucketsDb: DBLevel<NodeBucketIndex>;
  protected lock: Mutex = new Mutex();
  protected _started: boolean = false;

  constructor({
    db,
    nodeManager,
    logger,
  }: {
    db: DB;
    nodeManager: NodeManager;
    logger?: Logger;
  }) {
    this.logger = logger ?? new Logger('NodeGraph');
    this.db = db;
    this.nodeManager = nodeManager;
  }

  get started(): boolean {
    return this._started;
  }

  get locked(): boolean {
    return this.lock.isLocked();
  }

  public async start({
    nodeId,
    fresh = false,
  }: {
    nodeId: NodeId;
    fresh?: boolean;
  }) {
    try {
      this.logger.info('Starting Node Graph');
      this._started = true;
      if (!this.db.started) {
        throw new dbErrors.ErrorDBNotStarted();
      }
      if (!this.nodeManager.started) {
        throw new nodeErrors.ErrorNodeManagerNotStarted();
      }
      const nodeGraphDb = await this.db.level<string>(this.nodeGraphDbDomain);
      // buckets stores NodeBucketIndex -> NodeBucket
      const nodeGraphBucketsDb = await this.db.level<NodeBucketIndex>(
        this.nodeGraphBucketsDbDomain[1],
        nodeGraphDb,
      );
      if (fresh) {
        await nodeGraphDb.clear();
      }
      this.nodeId = nodeId;
      this.nodeGraphDb = nodeGraphDb;
      this.nodeGraphBucketsDb = nodeGraphBucketsDb;
      // TODO: change these to seed nodes
      // populate this node's bucket database
      // gets the k closest nodes from each broker
      // and adds each of them to the database
      for (const [, conn] of this.nodeManager.getBrokerNodeConnections()) {
        const nodes = await conn.getClosestNodes(this.nodeId);
        for (const n of nodes) {
          await this.nodeManager.createConnectionToNode(n.id, n.address);
          await this.setNode(n.id, n.address);
        }
      }
      this.logger.info('Started Node Graph');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  public async stop() {
    if (!this._started) {
      return;
    }
    this.logger.info('Stopping Node Graph');
    this._started = false;
    this.logger.info('Stopped Node Graph');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
  public async transaction<T>(
    f: (nodeGraph: NodeGraph) => Promise<T>,
  ): Promise<T> {
    const release = await this.lock.acquire();
    try {
      return await f(this);
    } finally {
      release();
    }
  }

  /**
   * Transaction wrapper that will not lock if the operation was executed
   * within a transaction context
   */
  public async _transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this.lock.isLocked()) {
      return await f();
    } else {
      return await this.transaction(f);
    }
  }

  public getNodeId(): NodeId {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return this.nodeId;
  }

  public async getNode(nodeId: NodeId): Promise<NodeAddress | undefined> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return await this._transaction(async () => {
      const bucketIndex = this.getBucketIndex(nodeId);
      const bucket = await this.db.get<NodeBucket>(
        this.nodeGraphBucketsDbDomain,
        bucketIndex.toString(),
      );
      if (bucket != null && nodeId in bucket) {
        return bucket[nodeId].address;
      }
      return;
    });
  }

  public async getBucket(bucketIndex: number): Promise<NodeBucket | undefined> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return await this._transaction(async () => {
      const bucket = await this.db.get<NodeBucket>(
        this.nodeGraphBucketsDbDomain,
        lexi.pack(bucketIndex, 'hex').toString(),
      );
      // Cast the non-primitive types correctly (ensures type safety when using them)
      for (const nodeId in bucket) {
        bucket[nodeId].address.ip = bucket[nodeId].address.ip as Host;
        bucket[nodeId].address.port = bucket[nodeId].address.port as Port;
        bucket[nodeId].lastUpdated = new Date(bucket[nodeId].lastUpdated);
      }
      return bucket;
    });
  }

  /**
   * Sets a node to the bucket database
   * This may delete an existing node if the bucket is filled up
   */
  public async setNode(
    nodeId: NodeId,
    nodeAddress: NodeAddress,
  ): Promise<void> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return await this._transaction(async () => {
      const ops = await this.setNodeOps(nodeId, nodeAddress);
      await this.db.batch(ops);
    });
  }

  public async setNodeOps(
    nodeId: NodeId,
    nodeAddress: NodeAddress,
  ): Promise<Array<DBOp>> {
    const bucketIndex = this.getBucketIndex(nodeId);
    let bucket = await this.db.get<NodeBucket>(
      this.nodeGraphBucketsDbDomain,
      bucketIndex.toString(),
    );
    if (bucket == null) {
      bucket = {};
    }
    const bucketEntries = Object.entries(bucket);
    if (bucketEntries.length === this.maxNodesPerBucket) {
      const leastActive = bucketEntries.reduce((prev, curr) => {
        return prev[1].lastUpdated < curr[1].lastUpdated ? prev : curr;
      });
      delete bucket[leastActive[0]];
    }
    bucket[nodeId] = {
      address: nodeAddress,
      lastUpdated: new Date(),
    };
    return [
      {
        type: 'put',
        domain: this.nodeGraphBucketsDbDomain,
        key: bucketIndex.toString(),
        value: bucket,
      },
    ];
  }

  /**
   * Updates an existing node
   * It will update the lastUpdated time
   * Optionally it can replace the NodeAddress
   */
  public async updateNode(
    nodeId: NodeId,
    nodeAddress?: NodeAddress,
  ): Promise<void> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return await this._transaction(async () => {
      const ops = await this.updateNodeOps(nodeId, nodeAddress);
      await this.db.batch(ops);
    });
  }

  public async updateNodeOps(
    nodeId: NodeId,
    nodeAddress?: NodeAddress,
  ): Promise<Array<DBOp>> {
    const bucketIndex = this.getBucketIndex(nodeId);
    const bucket = await this.db.get<NodeBucket>(
      this.nodeGraphBucketsDbDomain,
      bucketIndex.toString(),
    );
    const ops: Array<DBOp> = [];
    if (bucket != null && nodeId in bucket) {
      bucket[nodeId].lastUpdated = new Date();
      if (nodeAddress != null) {
        bucket[nodeId].address = nodeAddress;
      }
      ops.push({
        type: 'put',
        domain: this.nodeGraphBucketsDbDomain,
        key: bucketIndex.toString(),
        value: bucket,
      });
    } else {
      throw new nodeErrors.ErrorNodeGraphNodeIdMissing();
    }
    return ops;
  }

  public async unsetNode(nodeId: NodeId): Promise<void> {
    if (!this._started) {
      throw new nodeErrors.ErrorNodeGraphNotStarted();
    }
    return await this._transaction(async () => {
      const ops = await this.unsetNodeOps(nodeId);
      await this.db.batch(ops);
    });
  }

  public async unsetNodeOps(nodeId: NodeId): Promise<Array<DBOp>> {
    const bucketIndex = this.getBucketIndex(nodeId);
    const bucket = await this.db.get<NodeBucket>(
      this.nodeGraphBucketsDbDomain,
      bucketIndex.toString(),
    );
    const ops: Array<DBOp> = [];
    if (bucket == null) {
      return ops;
    }
    delete bucket[nodeId];
    if (Object.keys(bucket).length === 0) {
      ops.push({
        type: 'del',
        domain: this.nodeGraphBucketsDbDomain,
        key: bucketIndex.toString(),
      });
    } else {
      ops.push({
        type: 'put',
        domain: this.nodeGraphBucketsDbDomain,
        key: bucketIndex.toString(),
        value: bucket,
      });
    }
    return ops;
  }

  /**
   * Find the correct index of the k-bucket to add a new node to (for this node's
   * bucket database). Packs it as a lexicographic integer, such that the order
   * of buckets in leveldb is numerical order.
   */
  protected getBucketIndex(nodeId: NodeId): number {
    const index = nodeUtils.calculateBucketIndex(
      this.nodeId,
      nodeId,
      this.nodeIdBits,
    );
    return lexi.pack(index, 'hex');
  }

  // ok so here is where we must start refactoring this

  // this might be better to stream this directly to where it is being used
  // cause the subsequent functions are using this
  public async getAllBuckets(): Promise<Array<NodeBucket>> {
    return await this._transaction(async () => {
      const buckets: Array<NodeBucket> = [];
      const vals: Array<string | Buffer> = [];
      for await (const o of this.nodeGraphBucketsDb.createReadStream()) {
        const data = (o as any).value as Buffer;
        const bucket = this.db.unserializeDecrypt<NodeBucket>(data);
        bucket;
        buckets.push(bucket);
        vals.push(o);
      }
      // console.log(vals);
      return buckets;
    });
  }

  /**
   * Finds the set of nodes (of size k) known by the current node (i.e. in its
   * buckets database) that have the smallest distance to the target node (i.e.
   * are closest to the target node).
   * i.e. FIND_NODE RPC from Kademlia spec
   *
   * @param targetNodeId the node ID to find other nodes closest to it
   * @param numclosest the number of closest nodes to return (by default, returns
   * according to the maximum number of nodes per bucket)
   * @returns a mapping containing exactly k nodeIds -> nodeAddresses (unless the
   * current node has less than k nodes in all of its buckets, in which case it
   * returns all nodes it has knowledge of)
   */
  public async getClosestLocalNodes(
    targetNodeId: NodeId,
    numClosest: number = this.maxNodesPerBucket,
  ): Promise<Array<NodeData>> {
    // Retrieve all nodes from buckets in database
    const buckets = await this.getAllBuckets();
    // Iterate over all of the nodes in each bucket
    const distanceToNodes: Array<NodeData> = [];
    buckets.forEach(function (bucket) {
      for (const nodeId of Object.keys(bucket) as Array<NodeId>) {
        // Compute the distance from the node, and add it to the array.
        distanceToNodes.push({
          id: nodeId,
          address: bucket[nodeId].address,
          distance: nodeUtils.calculateDistance(nodeId, targetNodeId),
        });
      }
    });
    // Sort the array (based on the distance at index 1)
    distanceToNodes.sort(function (a: NodeData, b: NodeData) {
      if (a.distance > b.distance) {
        return 1;
      } else if (a.distance < b.distance) {
        return -1;
      } else {
        return 0;
      }
    });
    // Return the closest k nodes (i.e. the first k), or all nodes if < k in array
    return distanceToNodes.slice(0, numClosest);
  }

  /**
   * Attempts to locate a target node in the network (using Kademlia).
   * Adds all discovered, active nodes to the current node's database (up to k
   * discovered nodes).
   * Once the target node is found, the method returns and stops trying to locate
   * other nodes.
   *
   * Ultimately, attempts to perform a "DNS resolution" on the given target node
   * ID (i.e. given a node ID, retrieves the node address, containing its IP and
   * port).
   * @param targetNodeId ID of the node attempting to be found (i.e. attempting
   * to find its IP address and port)
   * @returns whether the target node was located in the process
   */
  public async getClosestGlobalNodes(
    targetNodeId: NodeId,
  ): Promise<NodeAddress | undefined> {
    let foundTarget: boolean = false;
    let foundAddress: NodeAddress | undefined = undefined;
    // Get the closest alpha nodes to the target node (set as shortlist)
    const shortlist: Array<NodeData> = await this.getClosestLocalNodes(
      targetNodeId,
      this.maxConcurrentNodeConnections,
    );
    // If we have no nodes at all in our database (even after synchronising),
    // then we should throw an error. We aren't going to find any others.
    if (shortlist.length == 0) {
      throw new nodeErrors.ErrorNodeGraphEmptyShortlist();
    }
    // Need to keep track of the nodes that have been contacted.
    // Not sufficient to simply check if there's already a pre-existing connection
    // in nodeConnections - what if there's been more than 1 invokation of
    // getClosestGlobalNodes()?
    const contacted: { [nodeId: string]: boolean } = {};
    // Iterate until we've found found and contacted k nodes
    while (Object.keys(contacted).length <= this.maxNodesPerBucket) {
      // while (!foundTarget) {
      // Remove the node from the front of the array
      const nextNode = shortlist.shift();
      // If we have no nodes left in the shortlist, then stop
      if (!nextNode) {
        break;
      }
      // Skip if the node has already been contacted
      if (contacted[nextNode.id]) {
        continue;
      }
      // Connect to the node (check if pre-existing connection exists, otherwise
      // create a new one)
      const nodeConnection = await this.nodeManager.createConnectionToNode(
        nextNode.id,
        nextNode.address,
      );
      contacted[nextNode.id] = true;
      // Ask the node to get their own closest nodes to the target.
      const foundClosest = await nodeConnection.getClosestNodes(targetNodeId);
      // Check to see if any of these are the target node. At the same time, add
      // them to the shortlist.
      for (const nodeData of foundClosest) {
        // Ignore any nodes that have been contacted
        if (contacted[nodeData.id]) {
          continue;
        }
        if (nodeData.id == targetNodeId) {
          foundTarget = true;
          // Attempt to create a connection to the node. Will throw an error
          // (ErrorConnectionStart, from ConnectionForward) if the connection
          // cannot be established
          await this.nodeManager.createConnectionToNode(
            nodeData.id,
            nodeData.address,
          );
          await this.setNode(nodeData.id, nodeData.address);
          foundAddress = nodeData.address;
          // We have found the target node, so we can stop trying to look for it
          // in the shortlist.
          break;
        }
        shortlist.push(nodeData);
      }
      // To make the number of jumps relatively short, should connect to the node/s
      // closest to the target first, and ask if they know of any closer nodes.
      // Then we can simply unshift the first (closest) element from the shortlist.
      shortlist.sort(function (a: NodeData, b: NodeData) {
        if (a.distance > b.distance) {
          return 1;
        } else if (a.distance < b.distance) {
          return -1;
        } else {
          return 0;
        }
      });
    }
    return foundAddress;
  }
}

export default NodeGraph;
