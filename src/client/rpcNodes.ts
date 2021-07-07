import * as grpc from "@grpc/grpc-js";
import * as clientPB from "@/proto/js/Client_pb";
import { NodeManager } from "@/nodes";

//Placeholder
const createVaultRPC = ({
  nodeManager
}: {
  nodeManager: NodeManager
}) => {
  return {
    /**
     * Lists all the nodes inside the current gestalt?
     */
    nodesList: async (
      call: grpc.ServerWritableStream<
        clientPB.EmptyMessage,
        clientPB.NodeMessage
        >,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Gets the info of the local keynode.
     * It expects
     * localNodeInfo: {
     *   pem: '',
     *   alias: '',
     *   publicKey: '',
     *   nodeId: '',
     *   rootPublicKey: '',
     *   nodeAddress: '',
     *   apiAddress: '',
     *   linkInfoList: [
     *      {
     *       type: '',
     *       node: '',
     *       identity: '',
     *       provider: '',
     *       dateissued: '',
     *       signature: '',
     *       key: '',
     *       url: '',
     *     },
     *  ],
     *},
     */
    nodesGetLocalInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.NodeInfoMessage
        >,
      callback: grpc.sendUnaryData<clientPB.NodeInfoMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Updates the info of the local keynode.
     */
    nodesUpdateLocalInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeInfoMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Gets the info of a remote node.
     */
    nodesGetInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.NodeInfoMessage
        >,
      callback: grpc.sendUnaryData<clientPB.NodeInfoMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Updates info of a remote node? not sure this is eneded.
     */
    nodesUpdateInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Checks if a remote node is online.
     */
    nodesPing: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.StatusMessage
        >,
      callback: grpc.sendUnaryData<clientPB.StatusMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Adds a node connection to the keynode.
     */
    nodesAdd: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    /**
     * Finds a remote node? not sure what this is for.
     */
    nodesFind: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },

  };
};

export default createVaultRPC;
