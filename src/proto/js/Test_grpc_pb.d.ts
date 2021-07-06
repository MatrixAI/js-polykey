// package: testInterface
// file: Test.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as Test_pb from "./Test_pb";

interface ITestService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    unary: ITestService_IUnary;
    serverStream: ITestService_IServerStream;
    clientStream: ITestService_IClientStream;
    duplexStream: ITestService_IDuplexStream;
}

interface ITestService_IUnary extends grpc.MethodDefinition<Test_pb.EchoMessage, Test_pb.EchoMessage> {
    path: "/testInterface.Test/Unary";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Test_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Test_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
}
interface ITestService_IServerStream extends grpc.MethodDefinition<Test_pb.EchoMessage, Test_pb.EchoMessage> {
    path: "/testInterface.Test/ServerStream";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Test_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Test_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
}
interface ITestService_IClientStream extends grpc.MethodDefinition<Test_pb.EchoMessage, Test_pb.EchoMessage> {
    path: "/testInterface.Test/ClientStream";
    requestStream: true;
    responseStream: false;
    requestSerialize: grpc.serialize<Test_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Test_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
}
interface ITestService_IDuplexStream extends grpc.MethodDefinition<Test_pb.EchoMessage, Test_pb.EchoMessage> {
    path: "/testInterface.Test/DuplexStream";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<Test_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Test_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Test_pb.EchoMessage>;
}

export const TestService: ITestService;

export interface ITestServer extends grpc.UntypedServiceImplementation {
    unary: grpc.handleUnaryCall<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    serverStream: grpc.handleServerStreamingCall<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    clientStream: grpc.handleClientStreamingCall<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    duplexStream: grpc.handleBidiStreamingCall<Test_pb.EchoMessage, Test_pb.EchoMessage>;
}

export interface ITestClient {
    unary(request: Test_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    unary(request: Test_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    unary(request: Test_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    serverStream(request: Test_pb.EchoMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Test_pb.EchoMessage>;
    serverStream(request: Test_pb.EchoMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Test_pb.EchoMessage>;
    clientStream(callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    clientStream(metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    clientStream(options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    clientStream(metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    duplexStream(): grpc.ClientDuplexStream<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    duplexStream(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    duplexStream(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Test_pb.EchoMessage, Test_pb.EchoMessage>;
}

export class TestClient extends grpc.Client implements ITestClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public unary(request: Test_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public unary(request: Test_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public unary(request: Test_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public serverStream(request: Test_pb.EchoMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Test_pb.EchoMessage>;
    public serverStream(request: Test_pb.EchoMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Test_pb.EchoMessage>;
    public clientStream(callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    public clientStream(metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    public clientStream(options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    public clientStream(metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Test_pb.EchoMessage) => void): grpc.ClientWritableStream<Test_pb.EchoMessage>;
    public duplexStream(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Test_pb.EchoMessage, Test_pb.EchoMessage>;
    public duplexStream(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Test_pb.EchoMessage, Test_pb.EchoMessage>;
}
