import type { EncryptedFS } from 'encryptedfs';
import type { VaultId } from './types';
import type { FileSystem } from '../types';

import fs from 'fs';
import path from 'path';
import base58 from 'bs58';
import * as keysUtils from '../keys/utils';
import * as utils from '../utils';

async function generateVaultKey(bits: number = 256) {
  return await keysUtils.generateKey(bits);
}

async function generateVaultId(): Promise<VaultId> {
  const id = await keysUtils.getRandomBytes(32);
  return base58.encode(id) as VaultId;
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
  for (const dirent of dirents) {
    const res = dirent;
    if (fs.statSync(path.join(dir, res)).isDirectory() && dirent !== '.git') {
      yield* readdirRecursivelyEFS(fs, path.join(dir, res));
    } else if (fs.statSync(path.join(dir, res)).isFile()) {
      yield path.resolve(dir, res);
    }
  }
}

export {
  generateVaultKey,
  generateVaultId,
  fileExists,
  readdirRecursively,
  readdirRecursivelyEFS,
};
