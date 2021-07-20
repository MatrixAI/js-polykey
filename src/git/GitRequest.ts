/**
 * Responsible for converting HTTP messages from isomorphic-git into requests and sending them to a specific node.
 */
class GitRequest {
  private requestInfo: (vaultName: string) => AsyncIterableIterator<Uint8Array>;
  private requestPack: (
    vaultName: string,
    body: any,
  ) => AsyncIterableIterator<Uint8Array>;
  private requestVaultNames: () => Promise<string[]>;

  constructor(
    requestInfo: (vaultName: string) => AsyncIterableIterator<Uint8Array>,
    requestPack: (
      vaultName: string,
      body: Buffer,
    ) => AsyncIterableIterator<Uint8Array>,
    requestVaultNames: () => Promise<string[]>,
  ) {
    this.requestInfo = requestInfo;
    this.requestPack = requestPack;
    this.requestVaultNames = requestVaultNames;
  }

  /**
   * The custom http request method to feed into isomorphic-git's [custom http object](https://isomorphic-git.org/docs/en/http)
   * In the future this will need to be changed in order to handle the receive-pack command from isomorphic-git. This will be
   * in the url passed into the request function and is needed for push functionality
   */
  public async request({
    url,
    method = 'GET',
    headers = {},
    body = Buffer.from(''),
  }) {
    const u = new URL(url);

    // Parse request
    if (method == 'GET') {
      const match = u.pathname.match(/\/(.+)\/info\/refs$/);
      if (!match || /\.\./.test(match[1])) {
        throw new Error('Error');
      }

      const vaultId = match![1];

      const infoResponse = this.requestInfo(vaultId);

      return {
        url: url,
        method: method,
        body: infoResponse,
        headers: headers,
        statusCode: 200,
        statusMessage: 'OK',
      };
    } else if (method == 'POST') {
      const match = u.pathname.match(/\/(.+)\/git-(.+)/);
      if (!match || /\.\./.test(match[1])) {
        throw new Error('Error');
      }

      const vaultId = match![1];

      const packResponse = this.requestPack(vaultId, body[0]);

      return {
        url: url,
        method: method,
        body: packResponse,
        headers: headers,
        statusCode: 200,
        statusMessage: 'OK',
      };
    } else {
      throw new Error('Method not supported');
    }
  }

  public async scanVaults() {
    return await this.requestVaultNames();
  }
}

export default GitRequest;
