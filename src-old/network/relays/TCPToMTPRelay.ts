import net from 'net';
import dgram from 'dgram';
import { PK_BOOTSTRAP_HOSTS } from '../../config';
import { Address } from '../../nodes/Node';
import TCPToMTPSocketPipe from '../socket-pipes/TCPToMTPSocketPipe';

class NodeRelay {
  relayedNodeId: string;

  private localNodeId: string;
  private udpSocket: dgram.Socket;
  private udpAddress: Address;
  private relayedTCPServer: net.Server;

  // pipes
  private tcpToMTPSocketPipes: Map<string, TCPToMTPSocketPipe> = new Map();

  constructor(
    localNodeId: string,
    udpSocket: dgram.Socket,
    udpAddress: Address,
  ) {
    this.localNodeId = localNodeId;
    this.udpSocket = udpSocket;
    this.udpAddress = udpAddress;
    this.relayedTCPServer = net.createServer((socket) => {
      // create tcp to mtp pipe
      const pipe = new TCPToMTPSocketPipe(
        this.localNodeId,
        socket,
        this.udpAddress,
        this.udpSocket,
      );
      this.tcpToMTPSocketPipes.set(pipe.id, pipe);
    });
  }

  async start() {
    return new Promise<void>((resolve, reject) => {
      try {
        const host = PK_BOOTSTRAP_HOSTS ?? '0.0.0.0';
        this.relayedTCPServer.listen(0, host, () => {
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise<void>((resolve, reject) => {
      this.tcpToMTPSocketPipes.forEach((p) => p.terminate());
      this.tcpToMTPSocketPipes = new Map();
      this.relayedTCPServer.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  public get relayedAddress(): Address {
    const address = Address.fromAddressInfo(
      <net.AddressInfo>this.relayedTCPServer.address(),
    );
    if (PK_BOOTSTRAP_HOSTS) {
      address.updateHost(PK_BOOTSTRAP_HOSTS);
    }
    return address;
  }
}

export default NodeRelay;
