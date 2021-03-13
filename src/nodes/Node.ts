import net from 'net';
import dgram from 'dgram';
import crypto from 'crypto';
import { LinkInfo, LinkInfoIdentity } from '../links';
import { md, pki } from 'node-forge';
import { gestaltKey, GestaltKey } from '../gestalts';
import * as agentInterface from '../proto/js/Agent_pb';
import { JSONMapReplacer, JSONMapReviver } from '../utils';

class Address {
  host: string;
  port: number;
  constructor(host: string, port: number) {
    const parsedAddress = Address.parseHelper(`${host}:${port}`);
    this.host = parsedAddress.host;
    this.port = parsedAddress.port;
  }

  updateHost(host?: string) {
    if (host != undefined && host != '') {
      this.host = host;
    }
  }

  updatePort(port?: number) {
    if (port != undefined && port != 0) {
      this.port = port;
    }
  }

  /**
   * Create an address object from a address string
   * @param addressString Address string in the format of `${this.ip}:${this.port}`
   */
  static parse(addressString: string): Address {
    const { host, port } = Address.parseHelper(addressString);
    return new Address(host, port);
  }

  /**
   * Create an address object from a net.AddressInfo
   * @param addressInfo AddressInfo of desired address
   */
  static fromAddressInfo(addressInfo: net.AddressInfo | dgram.RemoteInfo) {
    const host =
      addressInfo.address == '::' ? 'localhost' : addressInfo.address;
    return new Address(host, addressInfo.port);
  }

  /**
   * Convert address into string of format `${this.host}:${this.port}`
   */
  toString() {
    return `${this.host}:${this.port}`;
  }

  /**
   * Parses an address string in the format of `host:port`
   */
  private static parseHelper(
    addressString: string,
  ): { host: string; port: number } {
    if (!addressString || addressString == '') {
      throw Error(`cannot parse empty or undefined string`);
    }
    const url = new URL('http://' + addressString);
    return { host: url.hostname, port: Number(url.port) };
  }
}

// The Node class is reserved for the local node's information and is modifiable
// as we have the ability to change its information and re-sign it as the owner
// of the private key it describes.
class Node {
  private internalAlias: string;
  public get alias(): string {
    return this.internalAlias;
  }
  public set alias(value: string) {
    this.internalAlias = value;
  }
  private internalId: string;
  public get id(): string {
    return this.internalId;
  }
  public set id(value: string) {
    this.internalId = value;
  }
  // Public key generated by kbpgp
  private internalPublicKey: string;
  public get publicKey(): string {
    return this.internalPublicKey;
  }
  public set publicKey(publicKey: string) {
    throw Error('cannot change public key once set');
  }

  // node root certificate for trusted connections
  private internalRootPublicKey: string;
  public get rootPublicKey(): string {
    return this.internalRootPublicKey;
  }
  public set rootPublicKey(certificate: string) {
    this.internalRootPublicKey = certificate;
  }

  // Address where all node operations occur over (might be obscured by NAT)
  private internalNodeAddress?: Address;
  public get nodeAddress(): Address | undefined {
    return this.internalNodeAddress;
  }
  public set nodeAddress(address: Address | undefined) {
    this.internalNodeAddress = address;
  }

  // Address over which the polykey HTTP API is serve
  private internalApiAddress?: Address;
  public get apiAddress(): Address | undefined {
    return this.internalApiAddress;
  }
  public set apiAddress(address: Address | undefined) {
    this.internalApiAddress = address;
  }

  // List of social proofs made by this node
  private internalLinkInfoMap: Map<GestaltKey, LinkInfo> = new Map();
  public get linkInfoList(): LinkInfo[] {
    return Array.from(this.internalLinkInfoMap.values());
  }
  public set linkInfoList(values: LinkInfo[]) {
    this.internalLinkInfoMap = new Map();
    values.forEach((li) => this.publishLinkInfo(li));
  }
  publishLinkInfo(linkInfo: LinkInfo) {
    let provider: string | undefined = undefined;
    try {
      provider = (linkInfo as LinkInfoIdentity).provider;
    } catch (error) {
      // no throw in case linkInfo is LinkInfoNode
    }
    const gKey = gestaltKey(linkInfo.key, provider);
    this.internalLinkInfoMap.set(gKey, linkInfo);
  }
  getLinkInfo(gKey: GestaltKey): LinkInfo | undefined {
    return this.internalLinkInfoMap.get(gKey);
  }

  constructor(
    alias: string,
    publicKey: string,
    rootPublicKey?: string,
    nodeAddress?: string,
    apiAddress?: string,
    linkInfoList?: LinkInfo[],
  ) {
    this.internalAlias = alias;
    this.internalPublicKey = Node.formatPublicKey(publicKey);
    this.internalId = Node.publicKeyToId(this.internalPublicKey);
    if (rootPublicKey) {
      this.internalRootPublicKey = Node.formatPublicKey(rootPublicKey);
    }
    if (nodeAddress) {
      this.internalNodeAddress = Address.parse(nodeAddress);
    }
    if (apiAddress) {
      this.internalApiAddress = Address.parse(apiAddress);
    }
    if (linkInfoList) {
      this.internalLinkInfoMap = new Map();
      linkInfoList.forEach((li) => this.publishLinkInfo(li));
    }
  }

  static publicKeyToId(publicKey: string) {
    const formatedPublicKey = Node.formatPublicKey(publicKey);
    // we are using md5 for hash + hex for encoding on the public key to make a short,
    // human readable/sharable name. example nodeId: 167dcbfa28e9425f3db39e89ab748540
    const id = crypto.createHash('md5').update(formatedPublicKey).digest('hex');
    return id;
  }

  static formatPublicKey(str: string): string {
    const startString = '-----BEGIN PUBLIC KEY-----';
    const endString = '-----END PUBLIC KEY-----';
    const publicKeyString = str.slice(
      str.indexOf(startString),
      str.indexOf(endString) + endString.length,
    );
    const publicKeyForge = pki.publicKeyFromPem(publicKeyString);
    return pki.publicKeyToPem(publicKeyForge);
  }

  static formatPemCertificate(str: string): string {
    const startString = '-----BEGIN CERTIFICATE-----';
    const endString = '-----END CERTIFICATE-----';
    return str.slice(
      str.indexOf(startString),
      str.indexOf(endString) + endString.length,
    );
  }

  deepCopy(): Node {
    return new Node(
      this.alias,
      this.publicKey,
      this.rootPublicKey,
      this.internalNodeAddress?.toString(),
      this.internalApiAddress?.toString(),
      this.linkInfoList,
    );
  }

  toX509Pem(signingKey: pki.rsa.PrivateKey): string {
    // create a certification request (CSR)
    const certificate = pki.createCertificate();
    certificate.serialNumber = '01';
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter = new Date();
    // valid for 10 years
    certificate.validity.notAfter.setFullYear(
      certificate.validity.notBefore.getFullYear() + 10,
    );

    const attrs = [
      {
        name: 'commonName',
        value: 'polykey',
      },
      {
        // alias
        type: '1.3.1.4.1',
        value: this.alias,
      },
      {
        // root certificate
        type: '1.3.1.4.2',
        value: this.rootPublicKey ?? '',
      },
      {
        // node address
        type: '1.3.1.4.3',
        value: this.internalNodeAddress?.toString() ?? '',
      },
      {
        // api address
        type: '1.3.1.4.4',
        value: this.internalApiAddress?.toString() ?? '',
      },
      {
        // link claim identity list
        type: '1.3.1.4.5',
        value: JSON.stringify(this.internalLinkInfoMap, JSONMapReplacer),
      },
    ];

    certificate.setSubject(attrs);
    certificate.setIssuer(attrs);
    certificate.publicKey = pki.publicKeyFromPem(this.internalPublicKey);

    certificate.setExtensions([
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: false,
        timeStamping: true,
      },
      {
        name: 'nsCertType',
        client: true,
        server: true,
        email: false,
        objsign: false,
        sslCA: true,
        emailCA: false,
        objCA: true,
      },
    ]);

    // sign certificate
    certificate.sign(signingKey, md.sha512.create());

    return pki.certificateToPem(certificate);
  }

  static parseX509Pem(pem: string) {
    const cert = pki.certificateFromPem(pem);

    // create a mapping from type to value
    const attributes: Map<string, any> = new Map();
    cert.issuer.attributes.forEach((a) => {
      attributes.set(a.type, a.value);
    });

    // retrieve attributes
    const alias: string = attributes.get('1.3.1.4.1') ?? '';
    const rootPublicKey: string = attributes.get('1.3.1.4.2') ?? '';
    const nodeAddress: string = attributes.get('1.3.1.4.3') ?? '';
    const apiAddress: string = attributes.get('1.3.1.4.4') ?? '';
    const linkInfoListString: string = attributes.get('1.3.1.4.5');
    const linkInfoList: Map<GestaltKey, LinkInfo> =
      JSON.parse(linkInfoListString, JSONMapReviver) ?? new Map();
    return {
      alias,
      publicKey: pki.publicKeyToPem(cert.publicKey),
      rootPublicKey,
      nodeAddress,
      apiAddress,
      linkInfoList,
    };
  }

  static fromX509Pem(pem: string): Node {
    const parsedCert = Node.parseX509Pem(pem);
    return new Node(
      parsedCert.alias,
      parsedCert.publicKey,
      parsedCert.rootPublicKey,
      parsedCert.nodeAddress,
      parsedCert.apiAddress,
      Array.from(parsedCert.linkInfoList.values()),
    );
  }
}

// This class is meant to be a readonly version of Node as we
// do not own the private key it describes so we can not resign
// changes made to it. The nodeAddress and apiAddresses are
// however changeable to make certain use cases practical.
class NodePeer extends Node {
  private internalPem: string;
  public get pem(): string {
    return this.internalPem;
  }
  public set pem(value: string) {
    throw Error('pem cannot be set');
  }
  public get id(): string {
    return super.id;
  }
  public set id(v: string) {
    throw Error('cannot set nodeId on a readonly node info');
  }
  public get publicKey(): string {
    return super.publicKey;
  }
  public set publicKey(v: string) {
    throw Error('cannot set publicKey on a readonly node info');
  }
  public get rootPublicKey(): string {
    return super.rootPublicKey;
  }
  public set rootPublicKey(v: string) {
    throw Error('cannot set rootPublicKey on a readonly node info');
  }
  public get linkInfoList(): LinkInfo[] {
    // underlying array should be immutable
    return [...super.linkInfoList];
  }
  public set linkInfoList(v: LinkInfo[]) {
    throw Error('cannot set proofList on a readonly node info');
  }

  // the only 3 things that can change in a read only node info
  // are the alias, nodeAddress and apiAddress. This is to facillitate
  // the user being able to change these if new knowledge becomes
  // available
  // unsignedAlias
  private signedAlias: string;
  private unsignedAlias?: string;
  public get hasUnsignedAlias(): boolean {
    return this.unsignedAlias != undefined;
  }
  public get alias(): string {
    if (this.unsignedAlias) {
      return this.unsignedAlias;
    } else {
      return this.signedAlias;
    }
  }
  public set alias(v: string) {
    this.unsignedAlias = v;
  }
  // unsignedNodeAddress
  private unsignedNodeAddress?: Address;
  public get hasUnsignedNodeAddress(): boolean {
    return this.unsignedNodeAddress != undefined;
  }
  public get nodeAddress(): Address | undefined {
    if (this.unsignedNodeAddress) {
      return this.unsignedNodeAddress;
    } else {
      return super.nodeAddress;
    }
  }
  public set nodeAddress(v: Address | undefined) {
    this.unsignedNodeAddress = v;
  }
  // unsignedApiAddress
  private unsignedApiAddress?: Address;
  public get hasUnsignedApiAddress(): boolean {
    return this.unsignedApiAddress != undefined;
  }
  public get apiAddress(): Address | undefined {
    if (this.unsignedApiAddress) {
      return this.unsignedApiAddress;
    } else {
      return super.apiAddress;
    }
  }
  public set apiAddress(v: Address | undefined) {
    this.unsignedApiAddress = v;
  }

  constructor(nodeInfoPem: string) {
    const pem = Node.formatPemCertificate(nodeInfoPem);
    const parsedCert = Node.parseX509Pem(pem);
    super(
      parsedCert.alias,
      parsedCert.publicKey,
      parsedCert.rootPublicKey,
      parsedCert.nodeAddress,
      parsedCert.apiAddress,
      Array.from(parsedCert.linkInfoList.values()),
    );
    this.internalPem = pem;
    this.signedAlias = parsedCert.alias;
  }

  deepCopy(): NodePeer {
    const newNodeInfo = new NodePeer(this.internalPem);
    newNodeInfo.unsignedAlias = this.unsignedAlias;
    newNodeInfo.unsignedApiAddress = this.unsignedApiAddress;
    newNodeInfo.unsignedNodeAddress = this.unsignedNodeAddress;
    return newNodeInfo;
  }

  toNodeInfoReadOnlyMessage(): agentInterface.NodeInfoReadOnlyMessage {
    const message = new agentInterface.NodeInfoReadOnlyMessage();
    message.setNodeId(this.id);
    message.setPem(this.pem);
    if (this.hasUnsignedAlias) {
      message.setUnsignedAlias(this.alias);
    }
    if (this.hasUnsignedNodeAddress) {
      message.setUnsignedNodeAddress(this.nodeAddress?.toString() ?? '');
    }
    if (this.hasUnsignedApiAddress) {
      message.setUnsignedApiAddress(this.apiAddress?.toString() ?? '');
    }
    return message;
  }

  static fromNodeInfoReadOnlyMessage(
    message: agentInterface.NodeInfoReadOnlyMessage.AsObject,
  ): NodePeer {
    const {
      pem,
      unsignedAlias,
      unsignedNodeAddress,
      unsignedApiAddress,
    } = message;
    const nodeInfo = new NodePeer(pem);
    if (unsignedAlias) {
      nodeInfo.alias = unsignedAlias;
    }
    if (unsignedNodeAddress) {
      nodeInfo.nodeAddress = Address.parse(unsignedNodeAddress);
    }
    if (unsignedApiAddress) {
      nodeInfo.apiAddress = Address.parse(unsignedApiAddress);
    }
    return nodeInfo;
  }
}

export { Address, Node, NodePeer };