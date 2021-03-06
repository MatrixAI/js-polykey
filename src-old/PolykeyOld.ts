import fs from 'fs';
import Logger from '@matrixai/logger';
// import HttpApi from './api/HttpApi';
import KeyManager from './keys/KeyManager';
import { LinkInfoIdentity } from './links';
import { promisifyGrpc } from './bin/utils';
import NodeManager from './nodes/NodeManager';
import PolykeyAgent from './agent/PolykeyAgent';
import VaultManager from './vaults/VaultManager';
import GestaltGraph from './gestalts/GestaltGraph';
import GestaltTrust from './gestalts/GestaltTrust';
import Discovery from './discovery/Discovery';
import NodeNotifications from './nodes/NodeNotifications';
import { ProviderManager, ProviderTokens } from './identities';
import { GitHubProvider } from './identities/providers/github';
import { Node, NodePeer, Address } from './nodes/Node';
import * as utils from './utils';

(JSON as any).canonicalize = require('canonicalize');

class Polykey {
  nodePath: string;
  vaultManager: VaultManager;
  keyManager: KeyManager;
  nodeManager: NodeManager;
  // httpApi: HttpApi;
  providerManager: ProviderManager;
  gestaltGraph: GestaltGraph;
  gestaltTrust: GestaltTrust;
  discovery: Discovery;
  logger: Logger;
  nodeNotifications: NodeNotifications;

  constructor(
    nodePath?: string,
    fileSystem: typeof fs = fs,
    keyManager?: KeyManager,
    nodeManager?: NodeManager,
    vaultManager?: VaultManager,
    logger?: Logger,
  ) {
    this.nodePath = utils.getNodePath(nodePath);
    this.logger = logger ?? new Logger();

    // Set key manager
    this.keyManager =
      keyManager ??
      new KeyManager(
        this.nodePath,
        fileSystem,
        this.logger.getChild('KeyManager'),
      );

    // Initialize node store and node discovery classes
    this.nodeManager =
      nodeManager ??
      new NodeManager(
        this.nodePath,
        fileSystem,
        this.keyManager,
        this.nodeNotifications,
        this.logger.getChild('NodeManager'),
      );

    // Load notification
    this.nodeNotifications = new NodeNotifications(
      this.nodeManager.verifyLinkClaim.bind(this.nodeManager),
      this.logger.getChild('NodeNotifications'),
    );

    // Set or Initialize vaultManager
    this.vaultManager =
      vaultManager ??
      new VaultManager(
        this.nodePath,
        fileSystem,
        this.keyManager,
        this.nodeManager.connectToNode.bind(this.nodeManager),
        this.nodeManager.setGitHandlers.bind(this.nodeManager),
        this.logger.getChild('VaultManager'),
      );

    // start the api
    // this.httpApi = new HttpApi(
    //   ((apiAddress: Address) => {
    //     this.nodeManager.nodeInfo.apiAddress = apiAddress;
    //   }).bind(this),
    //   this.nodeManager.pki.handleCSR.bind(this.nodeManager.pki),
    //   (() => this.nodeManager.pki.RootCertificatePem).bind(this),
    //   (() => this.nodeManager.pki.CertChain).bind(this),
    //   this.nodeManager.pki.createServerCredentials.bind(this.nodeManager.pki),
    //   this.vaultManager.getVaultNames.bind(this.vaultManager),
    //   ((vaultName: string) => this.vaultManager.newVault(vaultName)).bind(this),
    //   ((vaultName: string) => this.vaultManager.deleteVault(vaultName)).bind(
    //     this,
    //   ),
    //   ((vaultName: string) => {
    //     const vault = this.vaultManager.getVault(vaultName);
    //     return vault.listSecrets();
    //   }).bind(this),
    //   ((vaultName: string, secretName: string) => {
    //     const vault = this.vaultManager.getVault(vaultName);
    //     return vault.getSecret.bind(vault)(secretName);
    //   }).bind(this),
    //   (async (vaultName: string, secretName: string, secretContent: Buffer) => {
    //     const vault = this.vaultManager.getVault(vaultName);
    //     await vault.addSecret(secretName, secretContent);
    //   }).bind(this),
    //   (async (vaultName: string, secretName: string) => {
    //     const vault = this.vaultManager.getVault(vaultName);
    //     await vault.deleteSecret(secretName);
    //   }).bind(this),
    //   this.logger.getChild('HTTPAPI'),
    // );

    ////////////
    // Social //
    ////////////
    // TODO: this stuff is still just a WIP, so need to fix any hardcoded values after demo
    this.providerManager = new ProviderManager([
      new GitHubProvider(
        new ProviderTokens(this.nodePath, 'github.com', this.logger.getChild('ProviderTokens')),
        'ca5c4c520da868387c52',
        this.logger.getChild('GithubProvider'),
      ),
    ]);

    this.gestaltTrust = new GestaltTrust();
    this.gestaltGraph = new GestaltGraph(
      this.nodePath,
      this.gestaltTrust,
      this.nodeManager,
      this.providerManager,
      this.nodeManager.verifyLinkClaim.bind(this.nodeManager),
      this.logger.getChild('GestaltGraph'),
    );

    this.discovery = new Discovery(
      this.gestaltTrust,
      this.nodeManager,
      this.providerManager,
      this.nodeManager.verifyLinkClaim.bind(this.nodeManager),
      this.gestaltGraph,
      this.logger.getChild('Discovery'),
    );
  }

  // helper methods
  async loadGestaltGraph() {
    try {
      // get own username
      const gitHubProvider = this.providerManager.getProvider('github.com');
      const identityKey = await gitHubProvider.getIdentityKey();
      // get identity details
      const identityInfo = await gitHubProvider.getIdentityInfo(identityKey);
      // set initials on the gestalt graph
      this.gestaltGraph.setNode({ id: this.nodeManager.nodeInfo.id });
      const linkInfoList = this.nodeManager.nodeInfo.linkInfoList;
      const linkInfo = linkInfoList.length != 0 ? linkInfoList[0] : undefined;
      if (identityInfo && linkInfo) {
        this.logger.info('Setting gestalt graph');
        this.gestaltGraph.setLinkIdentity(
          linkInfo as LinkInfoIdentity,
          { id: this.nodeManager.nodeInfo.id },
          identityInfo,
        );
        this.logger.info('Gestalt graph has been loaded');
      } else {
        this.logger.error(
          'Gestalt could not be loaded because either identityInfo or linkInfo was undefined',
        );
        this.logger.error('identityInfo: ' + identityInfo?.toString());
        this.logger.error('linkInfo: ' + linkInfo?.toString());
      }
    } catch (error) {
      // no throw
      this.logger.error(error);
    }
  }
  async start() {
    this.loadGestaltGraph();
    if (!this.keyManager.started) {
      await this.keyManager.start();
    }
    await this.nodeManager.start();
    await this.vaultManager.start();
    // await this.httpApi.start();
  }

  async stop() {
    await this.nodeManager.stop();
    this.keyManager.stop();
    // await this.httpApi.stop();
  }
}

export default Polykey;
export {
  KeyManager,
  VaultManager,
  NodeManager,
  Node,
  NodePeer,
  PolykeyAgent,
  Address,
  promisifyGrpc,
};
