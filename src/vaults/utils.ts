import fs from 'fs';
import path from 'path';
import { EncryptedFS } from 'encryptedfs';
import { getRandomBytes, getRandomBytesSync } from '../keys/utils';

const KEY_LEN = 64;
const ID_LEN = 42;

async function generateVaultKey() {
  const key = await getRandomBytes(KEY_LEN);
  return Buffer.from(key);
}

function generateVaultKeySync() {
  const key = getRandomBytesSync(KEY_LEN);
  return Buffer.from(key);
}

async function generateVaultId() {
  const id = await getRandomBytes(ID_LEN);
  return id.toString('base64');
}

function generateVaultIdSync() {
  const id = getRandomBytesSync(ID_LEN);
  return id.toString('base64');
}

async function fileExists(fs, path): Promise<boolean> {
  try {
    const fh = await fs.open(path, 'r');
    fh.close();
  } catch (err) {
    if (err.code === 'ENOENT') {
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

async function* readdirRecursivelyEFS(fs: EncryptedFS, dir: string) {
  const dirents = await fs.promises.readdir(dir);
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent);
    if (
      (await fs.promises.stat(res)).isDirectory() &&
      !isUnixHiddenPath(dirent)
    ) {
      yield* readdirRecursively(res);
    } else if ((await fs.promises.stat(res)).isFile()) {
      yield res;
    }
  }
}

export {
  generateVaultKey,
  generateVaultKeySync,
  generateVaultId,
  generateVaultIdSync,
  fileExists,
  readdirRecursively,
  readdirRecursivelyEFS,
};