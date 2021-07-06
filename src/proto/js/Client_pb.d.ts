// package: clientInterface
// file: Client.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class EmptyMessage extends jspb.Message { 

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EmptyMessage.AsObject;
    static toObject(includeInstance: boolean, msg: EmptyMessage): EmptyMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EmptyMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EmptyMessage;
    static deserializeBinaryFromReader(message: EmptyMessage, reader: jspb.BinaryReader): EmptyMessage;
}

export namespace EmptyMessage {
    export type AsObject = {
    }
}

export class StatusMessage extends jspb.Message { 
    getSuccess(): boolean;
    setSuccess(value: boolean): StatusMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatusMessage.AsObject;
    static toObject(includeInstance: boolean, msg: StatusMessage): StatusMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StatusMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StatusMessage;
    static deserializeBinaryFromReader(message: StatusMessage, reader: jspb.BinaryReader): StatusMessage;
}

export namespace StatusMessage {
    export type AsObject = {
        success: boolean,
    }
}

export class EchoMessage extends jspb.Message { 
    getChallenge(): string;
    setChallenge(value: string): EchoMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): EchoMessage.AsObject;
    static toObject(includeInstance: boolean, msg: EchoMessage): EchoMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: EchoMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): EchoMessage;
    static deserializeBinaryFromReader(message: EchoMessage, reader: jspb.BinaryReader): EchoMessage;
}

export namespace EchoMessage {
    export type AsObject = {
        challenge: string,
    }
}

export class JWTTokenMessage extends jspb.Message { 
    getToken(): string;
    setToken(value: string): JWTTokenMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): JWTTokenMessage.AsObject;
    static toObject(includeInstance: boolean, msg: JWTTokenMessage): JWTTokenMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: JWTTokenMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): JWTTokenMessage;
    static deserializeBinaryFromReader(message: JWTTokenMessage, reader: jspb.BinaryReader): JWTTokenMessage;
}

export namespace JWTTokenMessage {
    export type AsObject = {
        token: string,
    }
}

export class VaultMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): VaultMessage;
    getId(): string;
    setId(value: string): VaultMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VaultMessage.AsObject;
    static toObject(includeInstance: boolean, msg: VaultMessage): VaultMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VaultMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VaultMessage;
    static deserializeBinaryFromReader(message: VaultMessage, reader: jspb.BinaryReader): VaultMessage;
}

export namespace VaultMessage {
    export type AsObject = {
        name: string,
        id: string,
    }
}

export class VaultSpecificMessage extends jspb.Message { 

    hasVault(): boolean;
    clearVault(): void;
    getVault(): VaultMessage | undefined;
    setVault(value?: VaultMessage): VaultSpecificMessage;
    getName(): string;
    setName(value: string): VaultSpecificMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VaultSpecificMessage.AsObject;
    static toObject(includeInstance: boolean, msg: VaultSpecificMessage): VaultSpecificMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VaultSpecificMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VaultSpecificMessage;
    static deserializeBinaryFromReader(message: VaultSpecificMessage, reader: jspb.BinaryReader): VaultSpecificMessage;
}

export namespace VaultSpecificMessage {
    export type AsObject = {
        vault?: VaultMessage.AsObject,
        name: string,
    }
}

export class SecretSpecificMessage extends jspb.Message { 

    hasVault(): boolean;
    clearVault(): void;
    getVault(): VaultSpecificMessage | undefined;
    setVault(value?: VaultSpecificMessage): SecretSpecificMessage;
    getContent(): string;
    setContent(value: string): SecretSpecificMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretSpecificMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SecretSpecificMessage): SecretSpecificMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretSpecificMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretSpecificMessage;
    static deserializeBinaryFromReader(message: SecretSpecificMessage, reader: jspb.BinaryReader): SecretSpecificMessage;
}

export namespace SecretSpecificMessage {
    export type AsObject = {
        vault?: VaultSpecificMessage.AsObject,
        content: string,
    }
}

export class SecretRenameMessage extends jspb.Message { 

    hasVault(): boolean;
    clearVault(): void;
    getVault(): VaultMessage | undefined;
    setVault(value?: VaultMessage): SecretRenameMessage;

    hasOldname(): boolean;
    clearOldname(): void;
    getOldname(): SecretMessage | undefined;
    setOldname(value?: SecretMessage): SecretRenameMessage;

    hasNewname(): boolean;
    clearNewname(): void;
    getNewname(): SecretMessage | undefined;
    setNewname(value?: SecretMessage): SecretRenameMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretRenameMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SecretRenameMessage): SecretRenameMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretRenameMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretRenameMessage;
    static deserializeBinaryFromReader(message: SecretRenameMessage, reader: jspb.BinaryReader): SecretRenameMessage;
}

export namespace SecretRenameMessage {
    export type AsObject = {
        vault?: VaultMessage.AsObject,
        oldname?: SecretMessage.AsObject,
        newname?: SecretMessage.AsObject,
    }
}

export class SecretNewMessage extends jspb.Message { 

    hasVault(): boolean;
    clearVault(): void;
    getVault(): VaultMessage | undefined;
    setVault(value?: VaultMessage): SecretNewMessage;
    getName(): string;
    setName(value: string): SecretNewMessage;
    getContent(): string;
    setContent(value: string): SecretNewMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretNewMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SecretNewMessage): SecretNewMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretNewMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretNewMessage;
    static deserializeBinaryFromReader(message: SecretNewMessage, reader: jspb.BinaryReader): SecretNewMessage;
}

export namespace SecretNewMessage {
    export type AsObject = {
        vault?: VaultMessage.AsObject,
        name: string,
        content: string,
    }
}

export class SecretMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): SecretMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SecretMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SecretMessage): SecretMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SecretMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SecretMessage;
    static deserializeBinaryFromReader(message: SecretMessage, reader: jspb.BinaryReader): SecretMessage;
}

export namespace SecretMessage {
    export type AsObject = {
        name: string,
    }
}

export class StatMessage extends jspb.Message { 
    getStats(): string;
    setStats(value: string): StatMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): StatMessage.AsObject;
    static toObject(includeInstance: boolean, msg: StatMessage): StatMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: StatMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): StatMessage;
    static deserializeBinaryFromReader(message: StatMessage, reader: jspb.BinaryReader): StatMessage;
}

export namespace StatMessage {
    export type AsObject = {
        stats: string,
    }
}

export class ShareMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): ShareMessage;
    getId(): string;
    setId(value: string): ShareMessage;
    getSet(): boolean;
    setSet(value: boolean): ShareMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ShareMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ShareMessage): ShareMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ShareMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ShareMessage;
    static deserializeBinaryFromReader(message: ShareMessage, reader: jspb.BinaryReader): ShareMessage;
}

export namespace ShareMessage {
    export type AsObject = {
        name: string,
        id: string,
        set: boolean,
    }
}

export class PermissionMessage extends jspb.Message { 
    getId(): string;
    setId(value: string): PermissionMessage;
    getAction(): string;
    setAction(value: string): PermissionMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PermissionMessage.AsObject;
    static toObject(includeInstance: boolean, msg: PermissionMessage): PermissionMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PermissionMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PermissionMessage;
    static deserializeBinaryFromReader(message: PermissionMessage, reader: jspb.BinaryReader): PermissionMessage;
}

export namespace PermissionMessage {
    export type AsObject = {
        id: string,
        action: string,
    }
}

export class NodeMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): NodeMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): NodeMessage.AsObject;
    static toObject(includeInstance: boolean, msg: NodeMessage): NodeMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: NodeMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): NodeMessage;
    static deserializeBinaryFromReader(message: NodeMessage, reader: jspb.BinaryReader): NodeMessage;
}

export namespace NodeMessage {
    export type AsObject = {
        name: string,
    }
}

export class CryptoMessage extends jspb.Message { 
    getData(): string;
    setData(value: string): CryptoMessage;
    getSignature(): string;
    setSignature(value: string): CryptoMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CryptoMessage.AsObject;
    static toObject(includeInstance: boolean, msg: CryptoMessage): CryptoMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CryptoMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CryptoMessage;
    static deserializeBinaryFromReader(message: CryptoMessage, reader: jspb.BinaryReader): CryptoMessage;
}

export namespace CryptoMessage {
    export type AsObject = {
        data: string,
        signature: string,
    }
}

export class KeyMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): KeyMessage;
    getKey(): string;
    setKey(value: string): KeyMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyMessage.AsObject;
    static toObject(includeInstance: boolean, msg: KeyMessage): KeyMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeyMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeyMessage;
    static deserializeBinaryFromReader(message: KeyMessage, reader: jspb.BinaryReader): KeyMessage;
}

export namespace KeyMessage {
    export type AsObject = {
        name: string,
        key: string,
    }
}

export class KeyPairMessage extends jspb.Message { 
    getPublic(): string;
    setPublic(value: string): KeyPairMessage;
    getPrivate(): string;
    setPrivate(value: string): KeyPairMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): KeyPairMessage.AsObject;
    static toObject(includeInstance: boolean, msg: KeyPairMessage): KeyPairMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: KeyPairMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): KeyPairMessage;
    static deserializeBinaryFromReader(message: KeyPairMessage, reader: jspb.BinaryReader): KeyPairMessage;
}

export namespace KeyPairMessage {
    export type AsObject = {
        pb_public: string,
        pb_private: string,
    }
}

export class CertificateMessage extends jspb.Message { 
    getCert(): string;
    setCert(value: string): CertificateMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CertificateMessage.AsObject;
    static toObject(includeInstance: boolean, msg: CertificateMessage): CertificateMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CertificateMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CertificateMessage;
    static deserializeBinaryFromReader(message: CertificateMessage, reader: jspb.BinaryReader): CertificateMessage;
}

export namespace CertificateMessage {
    export type AsObject = {
        cert: string,
    }
}

export class PasswordMessage extends jspb.Message { 
    getPassword(): string;
    setPassword(value: string): PasswordMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): PasswordMessage.AsObject;
    static toObject(includeInstance: boolean, msg: PasswordMessage): PasswordMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: PasswordMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): PasswordMessage;
    static deserializeBinaryFromReader(message: PasswordMessage, reader: jspb.BinaryReader): PasswordMessage;
}

export namespace PasswordMessage {
    export type AsObject = {
        password: string,
    }
}

export class ProviderMessage extends jspb.Message { 
    getId(): string;
    setId(value: string): ProviderMessage;
    getMessage(): string;
    setMessage(value: string): ProviderMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ProviderMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ProviderMessage): ProviderMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ProviderMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ProviderMessage;
    static deserializeBinaryFromReader(message: ProviderMessage, reader: jspb.BinaryReader): ProviderMessage;
}

export namespace ProviderMessage {
    export type AsObject = {
        id: string,
        message: string,
    }
}

export class TokenSpecificMessage extends jspb.Message { 

    hasProvider(): boolean;
    clearProvider(): void;
    getProvider(): ProviderMessage | undefined;
    setProvider(value?: ProviderMessage): TokenSpecificMessage;
    getToken(): string;
    setToken(value: string): TokenSpecificMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TokenSpecificMessage.AsObject;
    static toObject(includeInstance: boolean, msg: TokenSpecificMessage): TokenSpecificMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TokenSpecificMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TokenSpecificMessage;
    static deserializeBinaryFromReader(message: TokenSpecificMessage, reader: jspb.BinaryReader): TokenSpecificMessage;
}

export namespace TokenSpecificMessage {
    export type AsObject = {
        provider?: ProviderMessage.AsObject,
        token: string,
    }
}

export class TokenMessage extends jspb.Message { 
    getToken(): string;
    setToken(value: string): TokenMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): TokenMessage.AsObject;
    static toObject(includeInstance: boolean, msg: TokenMessage): TokenMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: TokenMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): TokenMessage;
    static deserializeBinaryFromReader(message: TokenMessage, reader: jspb.BinaryReader): TokenMessage;
}

export namespace TokenMessage {
    export type AsObject = {
        token: string,
    }
}

export class ProviderSearchMessage extends jspb.Message { 

    hasProvider(): boolean;
    clearProvider(): void;
    getProvider(): ProviderMessage | undefined;
    setProvider(value?: ProviderMessage): ProviderSearchMessage;
    clearSearchTermList(): void;
    getSearchTermList(): Array<string>;
    setSearchTermList(value: Array<string>): ProviderSearchMessage;
    addSearchTerm(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ProviderSearchMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ProviderSearchMessage): ProviderSearchMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ProviderSearchMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ProviderSearchMessage;
    static deserializeBinaryFromReader(message: ProviderSearchMessage, reader: jspb.BinaryReader): ProviderSearchMessage;
}

export namespace ProviderSearchMessage {
    export type AsObject = {
        provider?: ProviderMessage.AsObject,
        searchTermList: Array<string>,
    }
}

export class IdentityInfoMessage extends jspb.Message { 

    hasProvider(): boolean;
    clearProvider(): void;
    getProvider(): ProviderMessage | undefined;
    setProvider(value?: ProviderMessage): IdentityInfoMessage;
    getName(): string;
    setName(value: string): IdentityInfoMessage;
    getEmail(): string;
    setEmail(value: string): IdentityInfoMessage;
    getUrl(): string;
    setUrl(value: string): IdentityInfoMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): IdentityInfoMessage.AsObject;
    static toObject(includeInstance: boolean, msg: IdentityInfoMessage): IdentityInfoMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: IdentityInfoMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): IdentityInfoMessage;
    static deserializeBinaryFromReader(message: IdentityInfoMessage, reader: jspb.BinaryReader): IdentityInfoMessage;
}

export namespace IdentityInfoMessage {
    export type AsObject = {
        provider?: ProviderMessage.AsObject,
        name: string,
        email: string,
        url: string,
    }
}

export class GestaltMessage extends jspb.Message { 
    getName(): string;
    setName(value: string): GestaltMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GestaltMessage.AsObject;
    static toObject(includeInstance: boolean, msg: GestaltMessage): GestaltMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GestaltMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GestaltMessage;
    static deserializeBinaryFromReader(message: GestaltMessage, reader: jspb.BinaryReader): GestaltMessage;
}

export namespace GestaltMessage {
    export type AsObject = {
        name: string,
    }
}

export class GestaltTrustMessage extends jspb.Message { 
    getProvider(): string;
    setProvider(value: string): GestaltTrustMessage;
    getName(): string;
    setName(value: string): GestaltTrustMessage;
    getSet(): boolean;
    setSet(value: boolean): GestaltTrustMessage;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): GestaltTrustMessage.AsObject;
    static toObject(includeInstance: boolean, msg: GestaltTrustMessage): GestaltTrustMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: GestaltTrustMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): GestaltTrustMessage;
    static deserializeBinaryFromReader(message: GestaltTrustMessage, reader: jspb.BinaryReader): GestaltTrustMessage;
}

export namespace GestaltTrustMessage {
    export type AsObject = {
        provider: string,
        name: string,
        set: boolean,
    }
}

export class ActionsMessage extends jspb.Message { 
    clearActionList(): void;
    getActionList(): Array<string>;
    setActionList(value: Array<string>): ActionsMessage;
    addAction(value: string, index?: number): string;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ActionsMessage.AsObject;
    static toObject(includeInstance: boolean, msg: ActionsMessage): ActionsMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ActionsMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ActionsMessage;
    static deserializeBinaryFromReader(message: ActionsMessage, reader: jspb.BinaryReader): ActionsMessage;
}

export namespace ActionsMessage {
    export type AsObject = {
        actionList: Array<string>,
    }
}

export class SetActionsMessage extends jspb.Message { 

    hasNode(): boolean;
    clearNode(): void;
    getNode(): NodeMessage | undefined;
    setNode(value?: NodeMessage): SetActionsMessage;

    hasIdentity(): boolean;
    clearIdentity(): void;
    getIdentity(): ProviderMessage | undefined;
    setIdentity(value?: ProviderMessage): SetActionsMessage;
    getAction(): string;
    setAction(value: string): SetActionsMessage;

    getNodeOrProviderCase(): SetActionsMessage.NodeOrProviderCase;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SetActionsMessage.AsObject;
    static toObject(includeInstance: boolean, msg: SetActionsMessage): SetActionsMessage.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SetActionsMessage, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SetActionsMessage;
    static deserializeBinaryFromReader(message: SetActionsMessage, reader: jspb.BinaryReader): SetActionsMessage;
}

export namespace SetActionsMessage {
    export type AsObject = {
        node?: NodeMessage.AsObject,
        identity?: ProviderMessage.AsObject,
        action: string,
    }

    export enum NodeOrProviderCase {
        NODE_OR_PROVIDER_NOT_SET = 0,
        NODE = 1,
        IDENTITY = 2,
    }

}
