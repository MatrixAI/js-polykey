import os from 'os';
import fs from 'fs';
import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import path from 'path';
import process from 'process';
import randomBytes from 'secure-random-bytes';
import cryptoRandomString from 'crypto-random-string';

/** Internal  */
import { ErrorPolykey, ErrorSecretPath } from './errors';
import { PK_NODE_PATH } from './config';

/**
 * Returns a random string of ascii characters with a length specified by {length}
 */
function randomString(length: number): string {
  return cryptoRandomString({ length: length });
}

/**
 * Generates a random int with {length} digits
 */
function randomInt(length: number): number {
  return parseInt(cryptoRandomString({ length: length, type: 'numeric' }));
}

/**
 * Generates a random float between 0 and 1.
 */
function randomFloat(): number {
  return parseInt(cryptoRandomString({ length: 5, type: 'numeric' })) / 99999;
}

type SecretPathComponents = {
  vaultName: string;
  secretName: string;
  variableName?: string;
};

function parseSecretPath(secretPath: string): SecretPathComponents {
  const pathRegex = /^([a-zA-Z0-9_ -]+)(?::)([a-zA-Z0-9_ -]+)(?:=)?([a-zA-Z_][a-zA-Z0-9_]+)?$/;
  if (
    secretPath.length < 1 ||
    (secretPath.length == 1 && !pathRegex.test(secretPath[0]))
  ) {
    throw new ErrorSecretPath('secret path is of the wrong format');
  }

  const [, vaultName, secretName, variableName] = secretPath.match(pathRegex)!;

  return {
    vaultName,
    secretName,
    variableName,
  };
}

/**
 * Gets the first promise fulfiled
 * @param promiseList List of promises
 */
async function promiseAny<T>(promiseList: Promise<T>[]): Promise<T> {
  return await new Promise((resolve, reject) => {
    const errorList: Error[] = [];
    for (const promise of promiseList) {
      promise
        .then((p) => {
          resolve(p);
        })
        .catch(() => null);

      promise.catch((error) => {
        errorList.push(error);
        // check if all have failed
        if (errorList.length == promiseList.length) {
          reject(errorList);
        }
      });
    }
  });
}

/**
 * Waits until all promises are fulfiled
 * @param promiseList List of promises
 */
async function promiseAll<T>(promiseList: Promise<T>[]): Promise<T[]> {
  return await new Promise((resolve, reject) => {
    const outputList: T[] = [];
    const errorList: Error[] = [];
    let count = 0;
    for (const promise of promiseList) {
      promise
        .then((p) => {
          outputList.push(p);
        })
        .catch((error) => {
          errorList.push(error);
        })
        .finally(() => {
          count += 1;
          if (count >= promiseList.length) {
            // check if all have failed
            if (errorList.length == promiseList.length) {
              reject(
                errorList.reduceRight((p, c) =>
                  Error(`${p.message}||${c.message}`),
                ),
              );
            } else {
              resolve(outputList);
            }
          }
        });
    }
  });
}

function protobufToString(message: Uint8Array): string {
  return Buffer.from(message).toString('base64');
}

function stringToProtobuf(str: string): Uint8Array {
  return Buffer.from(str, 'base64');
}

async function sleep(ms: number) {
  return await new Promise((r) => setTimeout(r, ms));
}

async function tryPort(port?: number, host?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const options = { port: port ?? 0, host: host ?? 'localhost' };
    const server = net
      .createServer()
      .listen(options, () => {
        const { port } = server.address() as net.AddressInfo;
        server.removeAllListeners();
        server.close(() => resolve(port));
      })
      .on('error', (error) => reject(error));
  });
}

async function getPort(
  defaultPort?: number,
  defaultHost?: string,
): Promise<number> {
  // try provided default port and host
  if (defaultPort) {
    try {
      const port = await tryPort(defaultPort, defaultHost);
      return port;
    } catch (error) {
      // no throw
    }
  }
  // get a random port if not
  const port = await tryPort(0, defaultHost);
  return port;
}

function JSONMapReplacer(key: any, value: any) {
  const originalObject = this[key];
  if (originalObject instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(originalObject.entries()),
    };
  } else {
    return value;
  }
}

function JSONMapReviver(key: any, value: any) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
}

/**
 * @param  {Uint8Array} Uint8Array1
 * @param  {Uint8Array} Uint8Array2
 * @return {Boolean}
 */
function arrayEquals(array1: Uint8Array, array2: Uint8Array): boolean {
  if (array1 === array2) {
    return true;
  }
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0, length = array1.length; i < length; ++i) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

function isUnixHiddenPath(path: string): boolean {
  return /\.|\/\.[^\/]+/g.test(path);
}

async function* readdirRecursively(dir: string) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory() && !isUnixHiddenPath(dirent.name)) {
      yield* readdirRecursively(res);
    } else if (dirent.isFile()) {
      yield res;
    }
  }
}

function terminatingHttpServer(
  server: http.Server | https.Server,
): () => Promise<void> {
  let terminating: Promise<void>;
  const sockets = new Set<net.Socket>();
  const secureSockets = new Set<tls.TLSSocket>();
  server.on('connection', (socket) => {
    if (terminating) {
      socket.destroy();
    } else {
      sockets.add(socket);
      socket.once('close', () => {
        sockets.delete(socket);
      });
    }
  });
  server.on('secureConnection', (socket) => {
    if (terminating) {
      socket.destroy();
    } else {
      secureSockets.add(socket);
      socket.once('close', () => {
        secureSockets.delete(socket);
      });
    }
  });
  const destroySocket = (socket) => {
    socket.destroy();
    if (socket instanceof net.Socket) {
      sockets.delete(socket);
    } else {
      secureSockets.delete(socket);
    }
  };
  const terminate = async () => {
    if (terminating) {
      return terminating;
    }
    let resolveTerminating;
    let rejectTerminating;
    terminating = new Promise((resolve, reject) => {
      resolveTerminating = resolve;
      rejectTerminating = reject;
    });
    server.on('request', (incomingMessage, outgoingMessage) => {
      if (!outgoingMessage.headersSent) {
        outgoingMessage.setHeader('connection', 'close');
      }
    });
    for (const socket of sockets) {
      // This is the HTTP CONNECT request socket.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (!(socket.server instanceof http.Server)) {
        continue;
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const serverResponse = socket._httpMessage;
      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }
        continue;
      }
      destroySocket(socket);
    }
    for (const socket of secureSockets) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const serverResponse = socket._httpMessage;
      if (serverResponse) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader('connection', 'close');
        }
        continue;
      }
      destroySocket(socket);
    }
    if (sockets.size) {
      await sleep(1000);
      for (const socket of sockets) {
        destroySocket(socket);
      }
    }
    if (secureSockets.size) {
      await sleep(1000);
      for (const socket of secureSockets) {
        destroySocket(socket);
      }
    }
    server.close((error) => {
      if (error) {
        rejectTerminating(error);
      } else {
        resolveTerminating();
      }
    });
    return terminating;
  };
  return terminate;
}

function getDefaultNodePath(prefix: string = 'polykey'): string {
  const platform = os.platform();
  let p: string;
  if (platform === 'linux') {
    const homeDir = os.homedir();
    const dataDir = process.env.XDG_DATA_HOME;
    if (dataDir != null) {
      p = `${dataDir}/${prefix}`;
    } else {
      p = `${homeDir}/.local/share/${prefix}`;
    }
  } else if (platform === 'darwin') {
    const homeDir = os.homedir();
    p = `${homeDir}/Library/Application Support/${prefix}`;
  } else if (platform === 'win32') {
    const homeDir = os.homedir();
    const appDataDir = process.env.LOCALAPPDATA;
    if (appDataDir != null) {
      p = `${appDataDir}/${prefix}`;
    } else {
      p = `${homeDir}/AppData/Local/${prefix}`;
    }
  } else {
    throw new ErrorPolykey('Unknown platform');
  }
  return p;
}

function getNodePath(nodePath?: string) {
  if (nodePath) {
    return nodePath;
  }
  if (PK_NODE_PATH) {
    return PK_NODE_PATH;
  }
  return getDefaultNodePath();
}

export {
  randomString,
  randomInt,
  randomFloat,
  parseSecretPath,
  promiseAny,
  promiseAll,
  protobufToString,
  stringToProtobuf,
  sleep,
  getPort,
  JSONMapReplacer,
  JSONMapReviver,
  arrayEquals,
  isUnixHiddenPath,
  readdirRecursively,
  terminatingHttpServer,
  getDefaultNodePath,
  getNodePath,
};
