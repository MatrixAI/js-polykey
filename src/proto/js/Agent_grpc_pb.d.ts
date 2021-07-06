// package: agentInterface
// file: Agent.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as Agent_pb from "./Agent_pb";

interface IAgentService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    echo: IAgentService_IEcho;
    getGitInfo: IAgentService_IGetGitInfo;
    getGitPack: IAgentService_IGetGitPack;
    scanVaults: IAgentService_IScanVaults;
    getRootCertificate: IAgentService_IGetRootCertificate;
    requestCertificateSigning: IAgentService_IRequestCertificateSigning;
    getClosestLocalNodes: IAgentService_IGetClosestLocalNodes;
    getClaims: IAgentService_IGetClaims;
    getChainData: IAgentService_IGetChainData;
    synchronizeDHT: IAgentService_ISynchronizeDHT;
    sendHolePunchMessage: IAgentService_ISendHolePunchMessage;
    checkVaultPermisssions: IAgentService_IcheckVaultPermisssions;
}

interface IAgentService_IEcho extends grpc.MethodDefinition<Agent_pb.EchoMessage, Agent_pb.EchoMessage> {
    path: "/agentInterface.Agent/Echo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Agent_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.EchoMessage>;
}
interface IAgentService_IGetGitInfo extends grpc.MethodDefinition<Agent_pb.InfoRequest, Agent_pb.PackChunk> {
    path: "/agentInterface.Agent/GetGitInfo";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Agent_pb.InfoRequest>;
    requestDeserialize: grpc.deserialize<Agent_pb.InfoRequest>;
    responseSerialize: grpc.serialize<Agent_pb.PackChunk>;
    responseDeserialize: grpc.deserialize<Agent_pb.PackChunk>;
}
interface IAgentService_IGetGitPack extends grpc.MethodDefinition<Agent_pb.PackChunk, Agent_pb.PackChunk> {
    path: "/agentInterface.Agent/GetGitPack";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<Agent_pb.PackChunk>;
    requestDeserialize: grpc.deserialize<Agent_pb.PackChunk>;
    responseSerialize: grpc.serialize<Agent_pb.PackChunk>;
    responseDeserialize: grpc.deserialize<Agent_pb.PackChunk>;
}
interface IAgentService_IScanVaults extends grpc.MethodDefinition<Agent_pb.NodeIdMessage, Agent_pb.PackChunk> {
    path: "/agentInterface.Agent/ScanVaults";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Agent_pb.NodeIdMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.NodeIdMessage>;
    responseSerialize: grpc.serialize<Agent_pb.PackChunk>;
    responseDeserialize: grpc.deserialize<Agent_pb.PackChunk>;
}
interface IAgentService_IGetRootCertificate extends grpc.MethodDefinition<Agent_pb.EmptyMessage, Agent_pb.CertificateMessage> {
    path: "/agentInterface.Agent/GetRootCertificate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Agent_pb.CertificateMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.CertificateMessage>;
}
interface IAgentService_IRequestCertificateSigning extends grpc.MethodDefinition<Agent_pb.CertificateMessage, Agent_pb.CertificateMessage> {
    path: "/agentInterface.Agent/RequestCertificateSigning";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.CertificateMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.CertificateMessage>;
    responseSerialize: grpc.serialize<Agent_pb.CertificateMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.CertificateMessage>;
}
interface IAgentService_IGetClosestLocalNodes extends grpc.MethodDefinition<Agent_pb.NodeIdMessage, Agent_pb.NodeTableMessage> {
    path: "/agentInterface.Agent/GetClosestLocalNodes";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.NodeIdMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.NodeIdMessage>;
    responseSerialize: grpc.serialize<Agent_pb.NodeTableMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.NodeTableMessage>;
}
interface IAgentService_IGetClaims extends grpc.MethodDefinition<Agent_pb.ClaimTypeMessage, Agent_pb.ClaimsMessage> {
    path: "/agentInterface.Agent/GetClaims";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.ClaimTypeMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.ClaimTypeMessage>;
    responseSerialize: grpc.serialize<Agent_pb.ClaimsMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.ClaimsMessage>;
}
interface IAgentService_IGetChainData extends grpc.MethodDefinition<Agent_pb.EmptyMessage, Agent_pb.ChainDataMessage> {
    path: "/agentInterface.Agent/GetChainData";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Agent_pb.ChainDataMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.ChainDataMessage>;
}
interface IAgentService_ISynchronizeDHT extends grpc.MethodDefinition<Agent_pb.EmptyMessage, Agent_pb.NodeTableMessage> {
    path: "/agentInterface.Agent/SynchronizeDHT";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Agent_pb.NodeTableMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.NodeTableMessage>;
}
interface IAgentService_ISendHolePunchMessage extends grpc.MethodDefinition<Agent_pb.RelayMessage, Agent_pb.EmptyMessage> {
    path: "/agentInterface.Agent/SendHolePunchMessage";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.RelayMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.RelayMessage>;
    responseSerialize: grpc.serialize<Agent_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.EmptyMessage>;
}
interface IAgentService_IcheckVaultPermisssions extends grpc.MethodDefinition<Agent_pb.VaultPermMessage, Agent_pb.PermissionMessage> {
    path: "/agentInterface.Agent/checkVaultPermisssions";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Agent_pb.VaultPermMessage>;
    requestDeserialize: grpc.deserialize<Agent_pb.VaultPermMessage>;
    responseSerialize: grpc.serialize<Agent_pb.PermissionMessage>;
    responseDeserialize: grpc.deserialize<Agent_pb.PermissionMessage>;
}

export const AgentService: IAgentService;

export interface IAgentServer extends grpc.UntypedServiceImplementation {
    echo: grpc.handleUnaryCall<Agent_pb.EchoMessage, Agent_pb.EchoMessage>;
    getGitInfo: grpc.handleServerStreamingCall<Agent_pb.InfoRequest, Agent_pb.PackChunk>;
    getGitPack: grpc.handleBidiStreamingCall<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    scanVaults: grpc.handleServerStreamingCall<Agent_pb.NodeIdMessage, Agent_pb.PackChunk>;
    getRootCertificate: grpc.handleUnaryCall<Agent_pb.EmptyMessage, Agent_pb.CertificateMessage>;
    requestCertificateSigning: grpc.handleUnaryCall<Agent_pb.CertificateMessage, Agent_pb.CertificateMessage>;
    getClosestLocalNodes: grpc.handleUnaryCall<Agent_pb.NodeIdMessage, Agent_pb.NodeTableMessage>;
    getClaims: grpc.handleUnaryCall<Agent_pb.ClaimTypeMessage, Agent_pb.ClaimsMessage>;
    getChainData: grpc.handleUnaryCall<Agent_pb.EmptyMessage, Agent_pb.ChainDataMessage>;
    synchronizeDHT: grpc.handleUnaryCall<Agent_pb.EmptyMessage, Agent_pb.NodeTableMessage>;
    sendHolePunchMessage: grpc.handleUnaryCall<Agent_pb.RelayMessage, Agent_pb.EmptyMessage>;
    checkVaultPermisssions: grpc.handleUnaryCall<Agent_pb.VaultPermMessage, Agent_pb.PermissionMessage>;
}

export interface IAgentClient {
    echo(request: Agent_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    echo(request: Agent_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    echo(request: Agent_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    getGitInfo(request: Agent_pb.InfoRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    getGitInfo(request: Agent_pb.InfoRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    getGitPack(): grpc.ClientDuplexStream<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    getGitPack(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    getGitPack(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    scanVaults(request: Agent_pb.NodeIdMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    scanVaults(request: Agent_pb.NodeIdMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    getRootCertificate(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    getRootCertificate(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    getRootCertificate(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    requestCertificateSigning(request: Agent_pb.CertificateMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    requestCertificateSigning(request: Agent_pb.CertificateMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    requestCertificateSigning(request: Agent_pb.CertificateMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    getClosestLocalNodes(request: Agent_pb.NodeIdMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    getClosestLocalNodes(request: Agent_pb.NodeIdMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    getClosestLocalNodes(request: Agent_pb.NodeIdMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    getClaims(request: Agent_pb.ClaimTypeMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    getClaims(request: Agent_pb.ClaimTypeMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    getClaims(request: Agent_pb.ClaimTypeMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    getChainData(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    getChainData(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    getChainData(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    synchronizeDHT(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    synchronizeDHT(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    synchronizeDHT(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    sendHolePunchMessage(request: Agent_pb.RelayMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    sendHolePunchMessage(request: Agent_pb.RelayMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    sendHolePunchMessage(request: Agent_pb.RelayMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    checkVaultPermisssions(request: Agent_pb.VaultPermMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
    checkVaultPermisssions(request: Agent_pb.VaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
    checkVaultPermisssions(request: Agent_pb.VaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
}

export class AgentClient extends grpc.Client implements IAgentClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public echo(request: Agent_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public echo(request: Agent_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public echo(request: Agent_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public getGitInfo(request: Agent_pb.InfoRequest, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    public getGitInfo(request: Agent_pb.InfoRequest, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    public getGitPack(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    public getGitPack(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Agent_pb.PackChunk, Agent_pb.PackChunk>;
    public scanVaults(request: Agent_pb.NodeIdMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    public scanVaults(request: Agent_pb.NodeIdMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Agent_pb.PackChunk>;
    public getRootCertificate(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public getRootCertificate(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public getRootCertificate(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public requestCertificateSigning(request: Agent_pb.CertificateMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public requestCertificateSigning(request: Agent_pb.CertificateMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public requestCertificateSigning(request: Agent_pb.CertificateMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public getClosestLocalNodes(request: Agent_pb.NodeIdMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public getClosestLocalNodes(request: Agent_pb.NodeIdMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public getClosestLocalNodes(request: Agent_pb.NodeIdMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public getClaims(request: Agent_pb.ClaimTypeMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    public getClaims(request: Agent_pb.ClaimTypeMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    public getClaims(request: Agent_pb.ClaimTypeMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.ClaimsMessage) => void): grpc.ClientUnaryCall;
    public getChainData(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    public getChainData(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    public getChainData(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.ChainDataMessage) => void): grpc.ClientUnaryCall;
    public synchronizeDHT(request: Agent_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public synchronizeDHT(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public synchronizeDHT(request: Agent_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.NodeTableMessage) => void): grpc.ClientUnaryCall;
    public sendHolePunchMessage(request: Agent_pb.RelayMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public sendHolePunchMessage(request: Agent_pb.RelayMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public sendHolePunchMessage(request: Agent_pb.RelayMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public checkVaultPermisssions(request: Agent_pb.VaultPermMessage, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
    public checkVaultPermisssions(request: Agent_pb.VaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
    public checkVaultPermisssions(request: Agent_pb.VaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Agent_pb.PermissionMessage) => void): grpc.ClientUnaryCall;
}
