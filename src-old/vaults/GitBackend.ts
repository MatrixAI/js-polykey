import Logger from '@matrixai/logger';
import { PassThrough } from 'readable-stream';

import Vault from '../vaults/Vault';

import * as gitUtils from './utils';

// Here is the protocol git outlines for sending pack files over http:
// https://git-scm.com/docs/pack-protocol/2.17.0
// https://github.com/git/git/blob/master/Documentation/technical/pack-protocol.txt
// This should be consulted in developing our upload pack implementation

// This git backend (as well as HttpDuplex class) is heavily inspired by node-git-server:
// https://github.com/gabrielcsapo/node-git-server

// We need someway to notify other agents about what vaults we have based on
// some type of authorisation because they don't explicitly know about them

class GitBackend {
  private getVault: (vaultID: string) => Vault;
  private getVaultNames: (
    nodeId: string,
  ) => Promise<Array<{ name: string; id: string }>>;
  private logger: Logger;

  constructor({
    getVault,
    getVaultNames,
    logger,
  }: {
    getVault: (vaultID: string) => Vault;
    getVaultNames: (
      nodeId: string,
    ) => Promise<Array<{ name: string; id: string }>>;
    logger?: Logger;
  }) {
    this.getVault = getVault;
    this.getVaultNames = getVaultNames;
    this.logger = logger ?? new Logger('GitBackend');
  }

  /**
   * Returns an async generator that yields buffers representing the git info response
   * @param vaultName Name of vault
   */
  public async *handleInfoRequest(
    vaultId: string,
  ): AsyncGenerator<Buffer | null> {
    // Service for uploading packets
    const service = 'upload-pack';

    const fileSystem = this.getVault(vaultId).EncryptedFS;

    if (!fileSystem.existsSync(vaultId)) {
      throw new Error(`repository does not exist: '${vaultId}'`);
    }

    // define the service
    yield Buffer.from(
      gitUtils.createGitPacketLine('# service=git-' + service + '\n'),
    );

    yield Buffer.from('0000');

    for (const buffer of (await gitUtils.uploadPack(
      fileSystem,
      vaultId,
      undefined,
      true,
    )) ?? []) {
      yield buffer;
    }
  }

  /**
   * Takes vaultName and a pack request and returns two streams used to handle the pack
   * response
   * @param vaultName name of the vault
   * @param body body of pack request
   * @returns Two streams used to send the pack response
   */
  public async handlePackRequest(vaultId: string, body: Buffer) {
    const fileSystem = this.getVault(vaultId).EncryptedFS;

    if (body.toString().slice(4, 8) == 'want') {
      const wantedObjectId = body.toString().slice(9, 49);
      const packResult = await gitUtils.packObjects(
        fileSystem,
        vaultId,
        [wantedObjectId],
        undefined,
      );
      const readable = new PassThrough();
      const progressStream = new PassThrough();
      const sideBand = gitUtils.mux(
        'side-band-64',
        readable,
        packResult.packstream,
        progressStream,
      );
      return [sideBand, progressStream];
    } else {
      throw new Error();
    }
  }

  /**
   * Returns a generator that yields the names of the vaults
   */
  public async *handleVaultNamesRequest(
    nodeId: string,
  ): AsyncGenerator<Uint8Array> {
    const vaults = await this.getVaultNames(nodeId);
    for (const vault in vaults) {
      yield Buffer.from(`${vaults[vault].id}\t${vaults[vault].name}`);
    }
  }
}

export default GitBackend;
