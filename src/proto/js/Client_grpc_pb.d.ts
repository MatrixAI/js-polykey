// package: clientInterface
// file: Client.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as Client_pb from "./Client_pb";

interface IClientService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    echo: IClientService_IEcho;
    agentStop: IClientService_IAgentStop;
    sessionRequestJWT: IClientService_ISessionRequestJWT;
    sessionChangeKey: IClientService_ISessionChangeKey;
    nodesList: IClientService_INodesList;
    keysRootKeyPair: IClientService_IKeysRootKeyPair;
    keysResetKeyPair: IClientService_IKeysResetKeyPair;
    keysRenewKeyPair: IClientService_IKeysRenewKeyPair;
    keysEncrypt: IClientService_IKeysEncrypt;
    keysDecrypt: IClientService_IKeysDecrypt;
    keysSign: IClientService_IKeysSign;
    keysVerify: IClientService_IKeysVerify;
    keysChangePassword: IClientService_IKeysChangePassword;
    certsGet: IClientService_ICertsGet;
    certsChainGet: IClientService_ICertsChainGet;
    vaultsList: IClientService_IVaultsList;
    vaultsCreate: IClientService_IVaultsCreate;
    vaultsRename: IClientService_IVaultsRename;
    vaultsDelete: IClientService_IVaultsDelete;
    vaultsListSecrets: IClientService_IVaultsListSecrets;
    vaultsMkdir: IClientService_IVaultsMkdir;
    vaultsStat: IClientService_IVaultsStat;
    vaultsPull: IClientService_IVaultsPull;
    vaultsScan: IClientService_IVaultsScan;
    vaultsDeleteSecret: IClientService_IVaultsDeleteSecret;
    vaultsEditSecret: IClientService_IVaultsEditSecret;
    vaultsGetSecret: IClientService_IVaultsGetSecret;
    vaultsRenameSecret: IClientService_IVaultsRenameSecret;
    vaultsNewSecret: IClientService_IVaultsNewSecret;
    vaultsNewDirSecret: IClientService_IVaultsNewDirSecret;
    setVaultPerms: IClientService_ISetVaultPerms;
    unsetVaultPerms: IClientService_IUnsetVaultPerms;
    vaultsPermissions: IClientService_IVaultsPermissions;
    identitiesAuthenticate: IClientService_IIdentitiesAuthenticate;
    tokensPut: IClientService_ITokensPut;
    tokensGet: IClientService_ITokensGet;
    tokensDelete: IClientService_ITokensDelete;
    providersGet: IClientService_IProvidersGet;
    gestaltsGetNode: IClientService_IGestaltsGetNode;
    gestaltsGetIdentity: IClientService_IGestaltsGetIdentity;
    gestaltsList: IClientService_IGestaltsList;
    gestaltsSetNode: IClientService_IGestaltsSetNode;
    gestaltsSetIdentity: IClientService_IGestaltsSetIdentity;
    gestaltSync: IClientService_IGestaltSync;
}

interface IClientService_IEcho extends grpc.MethodDefinition<Client_pb.EchoMessage, Client_pb.EchoMessage> {
    path: "/clientInterface.Client/Echo";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EchoMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EchoMessage>;
    responseSerialize: grpc.serialize<Client_pb.EchoMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EchoMessage>;
}
interface IClientService_IAgentStop extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/AgentStop";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_ISessionRequestJWT extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.JWTTokenMessage> {
    path: "/clientInterface.Client/SessionRequestJWT";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.JWTTokenMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.JWTTokenMessage>;
}
interface IClientService_ISessionChangeKey extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/SessionChangeKey";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_INodesList extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.NodeMessage> {
    path: "/clientInterface.Client/NodesList";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.NodeMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.NodeMessage>;
}
interface IClientService_IKeysRootKeyPair extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.KeyPairMessage> {
    path: "/clientInterface.Client/KeysRootKeyPair";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.KeyPairMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.KeyPairMessage>;
}
interface IClientService_IKeysResetKeyPair extends grpc.MethodDefinition<Client_pb.KeyMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/KeysResetKeyPair";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.KeyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.KeyMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_IKeysRenewKeyPair extends grpc.MethodDefinition<Client_pb.KeyMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/KeysRenewKeyPair";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.KeyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.KeyMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_IKeysEncrypt extends grpc.MethodDefinition<Client_pb.CryptoMessage, Client_pb.CryptoMessage> {
    path: "/clientInterface.Client/KeysEncrypt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
    responseSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
}
interface IClientService_IKeysDecrypt extends grpc.MethodDefinition<Client_pb.CryptoMessage, Client_pb.CryptoMessage> {
    path: "/clientInterface.Client/KeysDecrypt";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
    responseSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
}
interface IClientService_IKeysSign extends grpc.MethodDefinition<Client_pb.CryptoMessage, Client_pb.CryptoMessage> {
    path: "/clientInterface.Client/KeysSign";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
    responseSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
}
interface IClientService_IKeysVerify extends grpc.MethodDefinition<Client_pb.CryptoMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/KeysVerify";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.CryptoMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.CryptoMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IKeysChangePassword extends grpc.MethodDefinition<Client_pb.PasswordMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/KeysChangePassword";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.PasswordMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.PasswordMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_ICertsGet extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.CertificateMessage> {
    path: "/clientInterface.Client/CertsGet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.CertificateMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.CertificateMessage>;
}
interface IClientService_ICertsChainGet extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.CertificateMessage> {
    path: "/clientInterface.Client/CertsChainGet";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.CertificateMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.CertificateMessage>;
}
interface IClientService_IVaultsList extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.VaultMessage> {
    path: "/clientInterface.Client/VaultsList";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.VaultMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
}
interface IClientService_IVaultsCreate extends grpc.MethodDefinition<Client_pb.VaultMessage, Client_pb.VaultMessage> {
    path: "/clientInterface.Client/VaultsCreate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
    responseSerialize: grpc.serialize<Client_pb.VaultMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
}
interface IClientService_IVaultsRename extends grpc.MethodDefinition<Client_pb.VaultRenameMessage, Client_pb.VaultMessage> {
    path: "/clientInterface.Client/VaultsRename";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultRenameMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultRenameMessage>;
    responseSerialize: grpc.serialize<Client_pb.VaultMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
}
interface IClientService_IVaultsDelete extends grpc.MethodDefinition<Client_pb.VaultMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsDelete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsListSecrets extends grpc.MethodDefinition<Client_pb.VaultMessage, Client_pb.SecretMessage> {
    path: "/clientInterface.Client/VaultsListSecrets";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.VaultMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
    responseSerialize: grpc.serialize<Client_pb.SecretMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.SecretMessage>;
}
interface IClientService_IVaultsMkdir extends grpc.MethodDefinition<Client_pb.VaultMkdirMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsMkdir";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultMkdirMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultMkdirMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsStat extends grpc.MethodDefinition<Client_pb.VaultMessage, Client_pb.StatMessage> {
    path: "/clientInterface.Client/VaultsStat";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatMessage>;
}
interface IClientService_IVaultsPull extends grpc.MethodDefinition<Client_pb.VaultPullMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsPull";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.VaultPullMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.VaultPullMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsScan extends grpc.MethodDefinition<Client_pb.NodeMessage, Client_pb.VaultMessage> {
    path: "/clientInterface.Client/VaultsScan";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.NodeMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.NodeMessage>;
    responseSerialize: grpc.serialize<Client_pb.VaultMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.VaultMessage>;
}
interface IClientService_IVaultsDeleteSecret extends grpc.MethodDefinition<Client_pb.SecretMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsDeleteSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsEditSecret extends grpc.MethodDefinition<Client_pb.SecretEditMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsEditSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretEditMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretEditMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsGetSecret extends grpc.MethodDefinition<Client_pb.SecretMessage, Client_pb.SecretMessage> {
    path: "/clientInterface.Client/VaultsGetSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretMessage>;
    responseSerialize: grpc.serialize<Client_pb.SecretMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.SecretMessage>;
}
interface IClientService_IVaultsRenameSecret extends grpc.MethodDefinition<Client_pb.SecretRenameMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsRenameSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretRenameMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretRenameMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsNewSecret extends grpc.MethodDefinition<Client_pb.SecretMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsNewSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsNewDirSecret extends grpc.MethodDefinition<Client_pb.SecretDirectoryMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/VaultsNewDirSecret";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SecretDirectoryMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SecretDirectoryMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_ISetVaultPerms extends grpc.MethodDefinition<Client_pb.SetVaultPermMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/SetVaultPerms";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.SetVaultPermMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.SetVaultPermMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IUnsetVaultPerms extends grpc.MethodDefinition<Client_pb.UnsetVaultPermMessage, Client_pb.StatusMessage> {
    path: "/clientInterface.Client/UnsetVaultPerms";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.UnsetVaultPermMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.UnsetVaultPermMessage>;
    responseSerialize: grpc.serialize<Client_pb.StatusMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.StatusMessage>;
}
interface IClientService_IVaultsPermissions extends grpc.MethodDefinition<Client_pb.GetVaultPermMessage, Client_pb.PermissionMessage> {
    path: "/clientInterface.Client/VaultsPermissions";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.GetVaultPermMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.GetVaultPermMessage>;
    responseSerialize: grpc.serialize<Client_pb.PermissionMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.PermissionMessage>;
}
interface IClientService_IIdentitiesAuthenticate extends grpc.MethodDefinition<Client_pb.ProviderMessage, Client_pb.ProviderMessage> {
    path: "/clientInterface.Client/IdentitiesAuthenticate";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
    responseSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
}
interface IClientService_ITokensPut extends grpc.MethodDefinition<Client_pb.TokenSpecificMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/TokensPut";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.TokenSpecificMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.TokenSpecificMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_ITokensGet extends grpc.MethodDefinition<Client_pb.ProviderMessage, Client_pb.TokenMessage> {
    path: "/clientInterface.Client/TokensGet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
    responseSerialize: grpc.serialize<Client_pb.TokenMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.TokenMessage>;
}
interface IClientService_ITokensDelete extends grpc.MethodDefinition<Client_pb.ProviderMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/TokensDelete";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_IProvidersGet extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.ProviderMessage> {
    path: "/clientInterface.Client/ProvidersGet";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
}
interface IClientService_IGestaltsGetNode extends grpc.MethodDefinition<Client_pb.GestaltMessage, Client_pb.GestaltMessage> {
    path: "/clientInterface.Client/GestaltsGetNode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
    responseSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
}
interface IClientService_IGestaltsGetIdentity extends grpc.MethodDefinition<Client_pb.ProviderMessage, Client_pb.GestaltMessage> {
    path: "/clientInterface.Client/GestaltsGetIdentity";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.ProviderMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.ProviderMessage>;
    responseSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
}
interface IClientService_IGestaltsList extends grpc.MethodDefinition<Client_pb.EmptyMessage, Client_pb.GestaltMessage> {
    path: "/clientInterface.Client/GestaltsList";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
    responseSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
}
interface IClientService_IGestaltsSetNode extends grpc.MethodDefinition<Client_pb.GestaltTrustMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/GestaltsSetNode";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.GestaltTrustMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.GestaltTrustMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_IGestaltsSetIdentity extends grpc.MethodDefinition<Client_pb.GestaltTrustMessage, Client_pb.EmptyMessage> {
    path: "/clientInterface.Client/GestaltsSetIdentity";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<Client_pb.GestaltTrustMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.GestaltTrustMessage>;
    responseSerialize: grpc.serialize<Client_pb.EmptyMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.EmptyMessage>;
}
interface IClientService_IGestaltSync extends grpc.MethodDefinition<Client_pb.GestaltMessage, Client_pb.GestaltMessage> {
    path: "/clientInterface.Client/GestaltSync";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    requestDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
    responseSerialize: grpc.serialize<Client_pb.GestaltMessage>;
    responseDeserialize: grpc.deserialize<Client_pb.GestaltMessage>;
}

export const ClientService: IClientService;

export interface IClientServer extends grpc.UntypedServiceImplementation {
    echo: grpc.handleUnaryCall<Client_pb.EchoMessage, Client_pb.EchoMessage>;
    agentStop: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.EmptyMessage>;
    sessionRequestJWT: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.JWTTokenMessage>;
    sessionChangeKey: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.StatusMessage>;
    nodesList: grpc.handleServerStreamingCall<Client_pb.EmptyMessage, Client_pb.NodeMessage>;
    keysRootKeyPair: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.KeyPairMessage>;
    keysResetKeyPair: grpc.handleUnaryCall<Client_pb.KeyMessage, Client_pb.EmptyMessage>;
    keysRenewKeyPair: grpc.handleUnaryCall<Client_pb.KeyMessage, Client_pb.EmptyMessage>;
    keysEncrypt: grpc.handleUnaryCall<Client_pb.CryptoMessage, Client_pb.CryptoMessage>;
    keysDecrypt: grpc.handleUnaryCall<Client_pb.CryptoMessage, Client_pb.CryptoMessage>;
    keysSign: grpc.handleUnaryCall<Client_pb.CryptoMessage, Client_pb.CryptoMessage>;
    keysVerify: grpc.handleUnaryCall<Client_pb.CryptoMessage, Client_pb.StatusMessage>;
    keysChangePassword: grpc.handleUnaryCall<Client_pb.PasswordMessage, Client_pb.EmptyMessage>;
    certsGet: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.CertificateMessage>;
    certsChainGet: grpc.handleServerStreamingCall<Client_pb.EmptyMessage, Client_pb.CertificateMessage>;
    vaultsList: grpc.handleServerStreamingCall<Client_pb.EmptyMessage, Client_pb.VaultMessage>;
    vaultsCreate: grpc.handleUnaryCall<Client_pb.VaultMessage, Client_pb.VaultMessage>;
    vaultsRename: grpc.handleUnaryCall<Client_pb.VaultRenameMessage, Client_pb.VaultMessage>;
    vaultsDelete: grpc.handleUnaryCall<Client_pb.VaultMessage, Client_pb.StatusMessage>;
    vaultsListSecrets: grpc.handleServerStreamingCall<Client_pb.VaultMessage, Client_pb.SecretMessage>;
    vaultsMkdir: grpc.handleUnaryCall<Client_pb.VaultMkdirMessage, Client_pb.StatusMessage>;
    vaultsStat: grpc.handleUnaryCall<Client_pb.VaultMessage, Client_pb.StatMessage>;
    vaultsPull: grpc.handleUnaryCall<Client_pb.VaultPullMessage, Client_pb.StatusMessage>;
    vaultsScan: grpc.handleServerStreamingCall<Client_pb.NodeMessage, Client_pb.VaultMessage>;
    vaultsDeleteSecret: grpc.handleUnaryCall<Client_pb.SecretMessage, Client_pb.StatusMessage>;
    vaultsEditSecret: grpc.handleUnaryCall<Client_pb.SecretEditMessage, Client_pb.StatusMessage>;
    vaultsGetSecret: grpc.handleUnaryCall<Client_pb.SecretMessage, Client_pb.SecretMessage>;
    vaultsRenameSecret: grpc.handleUnaryCall<Client_pb.SecretRenameMessage, Client_pb.StatusMessage>;
    vaultsNewSecret: grpc.handleUnaryCall<Client_pb.SecretMessage, Client_pb.StatusMessage>;
    vaultsNewDirSecret: grpc.handleUnaryCall<Client_pb.SecretDirectoryMessage, Client_pb.StatusMessage>;
    setVaultPerms: grpc.handleUnaryCall<Client_pb.SetVaultPermMessage, Client_pb.StatusMessage>;
    unsetVaultPerms: grpc.handleUnaryCall<Client_pb.UnsetVaultPermMessage, Client_pb.StatusMessage>;
    vaultsPermissions: grpc.handleServerStreamingCall<Client_pb.GetVaultPermMessage, Client_pb.PermissionMessage>;
    identitiesAuthenticate: grpc.handleUnaryCall<Client_pb.ProviderMessage, Client_pb.ProviderMessage>;
    tokensPut: grpc.handleUnaryCall<Client_pb.TokenSpecificMessage, Client_pb.EmptyMessage>;
    tokensGet: grpc.handleUnaryCall<Client_pb.ProviderMessage, Client_pb.TokenMessage>;
    tokensDelete: grpc.handleUnaryCall<Client_pb.ProviderMessage, Client_pb.EmptyMessage>;
    providersGet: grpc.handleUnaryCall<Client_pb.EmptyMessage, Client_pb.ProviderMessage>;
    gestaltsGetNode: grpc.handleUnaryCall<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
    gestaltsGetIdentity: grpc.handleUnaryCall<Client_pb.ProviderMessage, Client_pb.GestaltMessage>;
    gestaltsList: grpc.handleServerStreamingCall<Client_pb.EmptyMessage, Client_pb.GestaltMessage>;
    gestaltsSetNode: grpc.handleUnaryCall<Client_pb.GestaltTrustMessage, Client_pb.EmptyMessage>;
    gestaltsSetIdentity: grpc.handleUnaryCall<Client_pb.GestaltTrustMessage, Client_pb.EmptyMessage>;
    gestaltSync: grpc.handleBidiStreamingCall<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
}

export interface IClientClient {
    echo(request: Client_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    echo(request: Client_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    echo(request: Client_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    agentStop(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    agentStop(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    agentStop(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    sessionRequestJWT(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    sessionRequestJWT(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    sessionRequestJWT(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    sessionChangeKey(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    sessionChangeKey(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    sessionChangeKey(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    nodesList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.NodeMessage>;
    nodesList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.NodeMessage>;
    keysRootKeyPair(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    keysRootKeyPair(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    keysRootKeyPair(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    keysResetKeyPair(request: Client_pb.KeyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysResetKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysResetKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysRenewKeyPair(request: Client_pb.KeyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysRenewKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysRenewKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysEncrypt(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysEncrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysEncrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysDecrypt(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysDecrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysDecrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysSign(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysSign(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysSign(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    keysVerify(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    keysVerify(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    keysVerify(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    keysChangePassword(request: Client_pb.PasswordMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysChangePassword(request: Client_pb.PasswordMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    keysChangePassword(request: Client_pb.PasswordMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    certsGet(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    certsGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    certsGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    certsChainGet(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.CertificateMessage>;
    certsChainGet(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.CertificateMessage>;
    vaultsList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    vaultsList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    vaultsCreate(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsCreate(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsCreate(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsRename(request: Client_pb.VaultRenameMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsRename(request: Client_pb.VaultRenameMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsRename(request: Client_pb.VaultRenameMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    vaultsDelete(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsDelete(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsDelete(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsListSecrets(request: Client_pb.VaultMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.SecretMessage>;
    vaultsListSecrets(request: Client_pb.VaultMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.SecretMessage>;
    vaultsMkdir(request: Client_pb.VaultMkdirMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsMkdir(request: Client_pb.VaultMkdirMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsMkdir(request: Client_pb.VaultMkdirMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsStat(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    vaultsStat(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    vaultsStat(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    vaultsPull(request: Client_pb.VaultPullMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsPull(request: Client_pb.VaultPullMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsPull(request: Client_pb.VaultPullMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsScan(request: Client_pb.NodeMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    vaultsScan(request: Client_pb.NodeMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    vaultsDeleteSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsDeleteSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsDeleteSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsEditSecret(request: Client_pb.SecretEditMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsEditSecret(request: Client_pb.SecretEditMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsEditSecret(request: Client_pb.SecretEditMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsGetSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    vaultsGetSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    vaultsGetSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    vaultsRenameSecret(request: Client_pb.SecretRenameMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsRenameSecret(request: Client_pb.SecretRenameMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsRenameSecret(request: Client_pb.SecretRenameMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    setVaultPerms(request: Client_pb.SetVaultPermMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    setVaultPerms(request: Client_pb.SetVaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    setVaultPerms(request: Client_pb.SetVaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    vaultsPermissions(request: Client_pb.GetVaultPermMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.PermissionMessage>;
    vaultsPermissions(request: Client_pb.GetVaultPermMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.PermissionMessage>;
    identitiesAuthenticate(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    identitiesAuthenticate(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    identitiesAuthenticate(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    tokensPut(request: Client_pb.TokenSpecificMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    tokensPut(request: Client_pb.TokenSpecificMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    tokensPut(request: Client_pb.TokenSpecificMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    tokensGet(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    tokensGet(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    tokensGet(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    tokensDelete(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    tokensDelete(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    tokensDelete(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    providersGet(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    providersGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    providersGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetNode(request: Client_pb.GestaltMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetNode(request: Client_pb.GestaltMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetNode(request: Client_pb.GestaltMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetIdentity(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetIdentity(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsGetIdentity(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    gestaltsList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.GestaltMessage>;
    gestaltsList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.GestaltMessage>;
    gestaltsSetNode(request: Client_pb.GestaltTrustMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltsSetNode(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltsSetNode(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    gestaltSync(): grpc.ClientDuplexStream<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
    gestaltSync(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
    gestaltSync(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
}

export class ClientClient extends grpc.Client implements IClientClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public echo(request: Client_pb.EchoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public echo(request: Client_pb.EchoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public echo(request: Client_pb.EchoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EchoMessage) => void): grpc.ClientUnaryCall;
    public agentStop(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public agentStop(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public agentStop(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public sessionRequestJWT(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    public sessionRequestJWT(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    public sessionRequestJWT(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.JWTTokenMessage) => void): grpc.ClientUnaryCall;
    public sessionChangeKey(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public sessionChangeKey(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public sessionChangeKey(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public nodesList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.NodeMessage>;
    public nodesList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.NodeMessage>;
    public keysRootKeyPair(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    public keysRootKeyPair(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    public keysRootKeyPair(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.KeyPairMessage) => void): grpc.ClientUnaryCall;
    public keysResetKeyPair(request: Client_pb.KeyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysResetKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysResetKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysRenewKeyPair(request: Client_pb.KeyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysRenewKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysRenewKeyPair(request: Client_pb.KeyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysEncrypt(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysEncrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysEncrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysDecrypt(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysDecrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysDecrypt(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysSign(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysSign(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysSign(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CryptoMessage) => void): grpc.ClientUnaryCall;
    public keysVerify(request: Client_pb.CryptoMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public keysVerify(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public keysVerify(request: Client_pb.CryptoMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public keysChangePassword(request: Client_pb.PasswordMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysChangePassword(request: Client_pb.PasswordMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public keysChangePassword(request: Client_pb.PasswordMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public certsGet(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public certsGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public certsGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.CertificateMessage) => void): grpc.ClientUnaryCall;
    public certsChainGet(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.CertificateMessage>;
    public certsChainGet(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.CertificateMessage>;
    public vaultsList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    public vaultsList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    public vaultsCreate(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsCreate(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsCreate(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsRename(request: Client_pb.VaultRenameMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsRename(request: Client_pb.VaultRenameMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsRename(request: Client_pb.VaultRenameMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.VaultMessage) => void): grpc.ClientUnaryCall;
    public vaultsDelete(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsDelete(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsDelete(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsListSecrets(request: Client_pb.VaultMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.SecretMessage>;
    public vaultsListSecrets(request: Client_pb.VaultMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.SecretMessage>;
    public vaultsMkdir(request: Client_pb.VaultMkdirMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsMkdir(request: Client_pb.VaultMkdirMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsMkdir(request: Client_pb.VaultMkdirMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsStat(request: Client_pb.VaultMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    public vaultsStat(request: Client_pb.VaultMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    public vaultsStat(request: Client_pb.VaultMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatMessage) => void): grpc.ClientUnaryCall;
    public vaultsPull(request: Client_pb.VaultPullMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsPull(request: Client_pb.VaultPullMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsPull(request: Client_pb.VaultPullMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsScan(request: Client_pb.NodeMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    public vaultsScan(request: Client_pb.NodeMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.VaultMessage>;
    public vaultsDeleteSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsDeleteSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsDeleteSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsEditSecret(request: Client_pb.SecretEditMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsEditSecret(request: Client_pb.SecretEditMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsEditSecret(request: Client_pb.SecretEditMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsGetSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    public vaultsGetSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    public vaultsGetSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.SecretMessage) => void): grpc.ClientUnaryCall;
    public vaultsRenameSecret(request: Client_pb.SecretRenameMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsRenameSecret(request: Client_pb.SecretRenameMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsRenameSecret(request: Client_pb.SecretRenameMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewSecret(request: Client_pb.SecretMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewSecret(request: Client_pb.SecretMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsNewDirSecret(request: Client_pb.SecretDirectoryMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public setVaultPerms(request: Client_pb.SetVaultPermMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public setVaultPerms(request: Client_pb.SetVaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public setVaultPerms(request: Client_pb.SetVaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public unsetVaultPerms(request: Client_pb.UnsetVaultPermMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.StatusMessage) => void): grpc.ClientUnaryCall;
    public vaultsPermissions(request: Client_pb.GetVaultPermMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.PermissionMessage>;
    public vaultsPermissions(request: Client_pb.GetVaultPermMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.PermissionMessage>;
    public identitiesAuthenticate(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public identitiesAuthenticate(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public identitiesAuthenticate(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public tokensPut(request: Client_pb.TokenSpecificMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public tokensPut(request: Client_pb.TokenSpecificMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public tokensPut(request: Client_pb.TokenSpecificMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public tokensGet(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    public tokensGet(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    public tokensGet(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.TokenMessage) => void): grpc.ClientUnaryCall;
    public tokensDelete(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public tokensDelete(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public tokensDelete(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public providersGet(request: Client_pb.EmptyMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public providersGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public providersGet(request: Client_pb.EmptyMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.ProviderMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetNode(request: Client_pb.GestaltMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetNode(request: Client_pb.GestaltMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetNode(request: Client_pb.GestaltMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetIdentity(request: Client_pb.ProviderMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetIdentity(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsGetIdentity(request: Client_pb.ProviderMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.GestaltMessage) => void): grpc.ClientUnaryCall;
    public gestaltsList(request: Client_pb.EmptyMessage, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.GestaltMessage>;
    public gestaltsList(request: Client_pb.EmptyMessage, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<Client_pb.GestaltMessage>;
    public gestaltsSetNode(request: Client_pb.GestaltTrustMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltsSetNode(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltsSetNode(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltsSetIdentity(request: Client_pb.GestaltTrustMessage, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: Client_pb.EmptyMessage) => void): grpc.ClientUnaryCall;
    public gestaltSync(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
    public gestaltSync(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<Client_pb.GestaltMessage, Client_pb.GestaltMessage>;
}
