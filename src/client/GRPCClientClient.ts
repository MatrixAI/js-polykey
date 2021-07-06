import type { TLSConfig } from '../network/types';

import * as clientErrors from './errors';
import { GRPCClient, utils as grpcUtils } from '../grpc';
import * as clientPB from '../proto/js/Client_pb';
import { ClientClient } from '../proto/js/Client_grpc_pb';

class GRPCClientClient extends GRPCClient<ClientClient> {
  public async start({
    tlsConfig,
    timeout = Infinity,
  }: {
    tlsConfig?: TLSConfig;
    timeout?: number;
  } = {}): Promise<void> {
    await super.start({
      clientConstructor: ClientClient,
      tlsConfig,
      timeout,
    });
  }

  public echo(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EchoMessage>(
      this.client,
      this.client.echo,
    )(...args);
  }

  public agentStop(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.agentStop,
    )(...args);
  }

  public sessionRequestJWT(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.JWTTokenMessage>(
      this.client,
      this.client.sessionRequestJWT,
    )(...args);
  }

  public sessionChangeKey(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.sessionChangeKey,
    )(...args);
  }

  public vaultsList(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.VaultMessage>(
      this.client,
      this.client.vaultsList,
    )(...args);
  }

  public vaultsCreate(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsCreate,
    )(...args);
  }

  public vaultsRename(...args) {
    if (!this.client) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsRename,
    )(...args);
  }

  public vaultsDelete(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsDelete,
    )(...args);
  }

  public vaultsPull(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.vaultsPull,
    )(...args);
  }

  public vaultsScan(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.VaultMessage>(
      this.client,
      this.client.vaultsScan,
    )(...args);
  }

  public vaultsShare(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ShareMessage>(
      this.client,
      this.client.vaultsShare,
    )(...args);
  }

  public vaultPermissions(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.PermissionMessage>(
      this.client,
      this.client.vaultsPermissions,
    )(...args);
  }

  public vaultsListSecrets(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.SecretMessage>(
      this.client,
      this.client.vaultsListSecrets,
    )(...args);
  }

  public vaultsMkdir(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.vaultsMkdir,
    )(...args);
  }

  public vaultsStat(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatMessage>(
      this.client,
      this.client.vaultsStat,
    )(...args);
  }

  public vaultsDeleteSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsDeleteSecret,
    )(...args);
  }

  public vaultsEditSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.vaultsEditSecret,
    )(...args);
  }

  public vaultsGetSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.SecretMessage>(
      this.client,
      this.client.vaultsGetSecret,
    )(...args);
  }

  public vaultsRenameSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsRenameSecret,
    )(...args);
  }

  public vaultsNewSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.vaultsNewSecret,
    )(...args);
  }

  public vaultsNewDirSecret(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.vaultsNewDirSecret,
    )(...args);
  }

  public keysRootKeyPair(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.KeyPairMessage>(
      this.client,
      this.client.keysRootKeyPair,
    )(...args);
  }

  public keysResetKeyPair(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.keysResetKeyPair,
    )(...args);
  }

  public keysRenewKeyPair(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.keysRenewKeyPair,
    )(...args);
  }

  public keysEncrypt(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
      this.client,
      this.client.keysEncrypt,
    )(...args);
  }

  public keysDecrypt(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
      this.client,
      this.client.keysDecrypt,
    )(...args);
  }

  public keysSign(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.CryptoMessage>(
      this.client,
      this.client.keysSign,
    )(...args);
  }

  public keysVerify(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.StatusMessage>(
      this.client,
      this.client.keysVerify,
    )(...args);
  }

  public keysChangePassword(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.keysChangePassword,
    )(...args);
  }

  public certsGet(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.CertificateMessage>(
      this.client,
      this.client.certsGet,
    )(...args);
  }

  public certsChainGet(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.CertificateMessage>(
      this.client,
      this.client.certsChainGet,
    )(...args);
  }

  public gestaltsList(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.GestaltMessage>(
      this.client,
      this.client.gestaltsList,
    )(...args);
  }

  public gestaltsSetNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsSetNode,
    )(...args);
  }

  public gestaltsSetIdentity(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsSetIdentity,
    )(...args);
  }

  public gestaltsGetIdentitiy(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
      this.client,
      this.client.gestaltsGetIdentity,
    )(...args);
  }

  public gestaltsGetNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
      this.client,
      this.client.gestaltsGetNode,
    )(...args);
  }

  public gestaltsDiscoverNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
      this.client,
      this.client.gestaltsDiscoverNode,
    )(...args);
  }

  public gestaltsDiscoverIdentity(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.GestaltMessage>(
      this.client,
      this.client.gestaltsDiscoverIdentity,
    )(...args);
  }

  public gestaltsGetActionsByNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
      this.client,
      this.client.gestaltsGetActionsByNode,
    )(...args);
  }

  public gestaltsGetActionsByIdentity(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ActionsMessage>(
      this.client,
      this.client.gestaltsGetActionsByIdentity,
    )(...args);
  }

  public gestaltsSetActionByNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsSetActionByNode,
    )(...args);
  }

  public gestaltsSetActionByIdentity(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsSetActionByIdentity,
    )(...args);
  }

  public gestaltsUnsetActionByNode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsUnsetActionByNode,
    )(...args);
  }

  public gestaltsUnsetActionByIdentity(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.gestaltsUnsetActionByIdentity,
    )(...args);
  }

  public tokensPut(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.tokensPut,
    )(...args);
  }

  public tokensGet(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.TokenMessage>(
      this.client,
      this.client.tokensGet,
    )(...args);
  }

  public tokensDelete(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.tokensDelete,
    )(...args);
  }

  public providersGet(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ProviderMessage>(
      this.client,
      this.client.providersGet,
    )(...args);
  }

  public identitiesAuthenticate(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyReadableStreamCall<clientPB.ProviderMessage>(
      this.client,
      this.client.identitiesAuthenticate,
    )(...args);
  }

  public identitiesGetConnectedInfos(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ProviderSearchMessage>(
      this.client,
      this.client.identitiesGetConnectedInfos,
    )(...args);
  }

  public identitiesGetInfo(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.ProviderMessage>(
      this.client,
      this.client.identitiesGetInfo,
    )(...args);
  }

  public identitiesAugmentKeynode(...args) {
    if (!this._started) throw new clientErrors.ErrorClientClientNotStarted();
    return grpcUtils.promisifyUnaryCall<clientPB.EmptyMessage>(
      this.client,
      this.client.identitiesAugmentKeynode,
    )(...args);
  }
}

export default GRPCClientClient;
