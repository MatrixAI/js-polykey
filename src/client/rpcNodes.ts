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
    nodesList: async (
      call: grpc.ServerWritableStream<
        clientPB.EmptyMessage,
        clientPB.NodeMessage
        >,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesGetLocalInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.NodeInfoMessage
        >,
      callback: grpc.sendUnaryData<clientPB.NodeInfoMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesUpdateLocalInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeInfoMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesGetInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.NodeInfoMessage
        >,
      callback: grpc.sendUnaryData<clientPB.NodeInfoMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesUpdateInfo: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesPing: async (
      call: grpc.ServerUnaryCall<
        clientPB.NodeMessage,
        clientPB.StatusMessage
        >,
      callback: grpc.sendUnaryData<clientPB.StatusMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
    nodesAdd: async (
      call: grpc.ServerUnaryCall<
        clientPB.EmptyMessage,
        clientPB.EmptyMessage
        >,
      callback: grpc.sendUnaryData<clientPB.EmptyMessage>,
    ): Promise<void> => {
      throw Error('Not implemented, placeholder');
    },
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
