import type { EncryptedFS } from 'encryptedfs';
import type { VaultId } from './types';
import type { FileSystem } from '../types';

import fs from 'fs';
import path from 'path';
import base58 from 'bs58';
import { v4 as uuid } from 'uuid';

import { GitRequest } from '../git';
import Logger from '@matrixai/logger';
import * as grpc from '@grpc/grpc-js';

import { promisify } from '../utils';

import * as agentPB from '../proto/js/Agent_pb';
import { GRPCClientAgent } from '../agent';

import * as keysUtils from '../keys/utils';
import * as utils from '../utils';
import { errors as vaultErrors } from './';

async function generateVaultKey(bits: number = 256) {
  return await keysUtils.generateKey(bits);
}

async function generateVaultId(): Promise<VaultId> {
  const vaultId = uuid();
  return vaultId as VaultId;
  // const id = await keysUtils.getRandomBytes(32);
  // return base58.encode(id) as VaultId;
}

async function fileExists(fs: FileSystem, path): Promise<boolean> {
  try {
    const fh = await fs.promises.open(path, 'r');
    fh.close();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
  }
  return true;
}

async function* readdirRecursively(dir: string) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* readdirRecursively(res);
    } else if (dirent.isFile()) {
      yield res;
    }
  }
}

async function* readdirRecursivelyEFS(fs: EncryptedFS, dir: string) {
  const readdir = utils.promisify(fs.readdir).bind(fs);
  const dirents = await readdir(dir);
  let secretPath: string;
  for (const dirent of dirents) {
    const res = dirent;
    secretPath = path.join(dir, res);
    if (fs.statSync(secretPath).isDirectory() && dirent !== '.git') {
      yield* readdirRecursivelyEFS(fs, secretPath);
    } else if (fs.statSync(secretPath).isFile()) {
      yield secretPath;
    }
  }
}

/**
 * Searches a list of vaults for the given vault Id and associated name
 * @throws If the vault Id does not exist
 */
function searchVaultName(vaultList: string[], vaultId: string): string {
  let vaultName: string | undefined;

  // Search each element in the list of vaults
  for (const elem in vaultList) {
    // List is of form <vaultName>\t<vaultId>
    const value = vaultList[elem].split('\t');
    if (value[0] === vaultId) {
      vaultName = value[1];
      break;
    }
  }
  if (!vaultName) {
    throw new vaultErrors.ErrorRemoteVaultUndefined(
      `${vaultId} does not exist on connected node`,
    );
  }
  return vaultName;
}

/**
 * Creates a GitRequest object from the desired node connection.
 * @param client GRPC connection to desired node
 */
async function constructGitHandler(client: GRPCClientAgent, nodeId: string): Promise<GitRequest> {
  const gitRequest = new GitRequest(
    ((vaultName: string) => requestInfo(vaultName, client)).bind(this),
    ((vaultName: string, body: any) =>
      requestPack(vaultName, body, client)).bind(this),
    (() => requestVaultNames(client, nodeId)).bind(this),
  );
  return gitRequest;
}

/**
 * Requests remote info from the connected node for the named vault.
 * @param vaultName Name of the desired vault
 * @param client A connection object to the node
 * @returns Async Generator of Uint8Arrays representing the Info Response
 */
async function *requestInfo(
  vaultId: string,
  client: GRPCClientAgent,
): AsyncGenerator<Uint8Array> {
  const request = new agentPB.InfoRequest();
  request.setVaultName(vaultId);
  const response = client.getGitInfo(request);

  for await (const resp of response) {
    yield resp.getChunk_asU8();
  }
}

/**
 * Requests a pack from the connected node for the named vault
 * @param vaultName name of vault
 * @param body contains the pack request
 * @param client A connection object to the node
 * @returns AsyncGenerator of Uint8Arrays representing the Pack Response
 */
async function *requestPack(
  vaultName: string,
  body: any,
  client: GRPCClientAgent,
): AsyncGenerator<Uint8Array> {
  const responseBuffers: Array<Buffer> = [];

  const meta = new grpc.Metadata();
  meta.set('vault-name', vaultName);

  const stream = client.getGitPack(meta);
  const write = promisify(stream.write).bind(stream);

  stream.on('data', (d) => {
    responseBuffers.push(d.getChunk_asU8());
  });

  const chunk = new agentPB.PackChunk();
  chunk.setChunk(body);
  write(chunk);
  stream.end();

  yield await new Promise<Uint8Array>((resolve) => {
    stream.once('end', () => {
      resolve(Buffer.concat(responseBuffers));
    });
  });
}

/**
 * Requests the vault names from the connected node.
 * @param client A connection object to the node
 */
async function requestVaultNames(
  client: GRPCClientAgent,
  nodeId: string,
): Promise<string[]> {
  const request = new agentPB.NodeIdMessage();
  request.setNodeid(nodeId);
  const response = client.scanVaults(request);

  const data: string[] = [];
  for await (const resp of response) {
    const chunk = resp.getChunk_asU8();
    data.push(Buffer.from(chunk).toString());
  }

  return data;
}

export {
  generateVaultKey,
  generateVaultId,
  fileExists,
  readdirRecursively,
  readdirRecursivelyEFS,
  constructGitHandler,
  searchVaultName,
};
