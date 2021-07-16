import os from 'os';
import path from 'path';
import fs from 'fs';
import { VirtualFS } from 'virtualfs';
import git from 'isomorphic-git';
import Vault from '@/vaults/Vault';
import Logger, { LogLevel, StreamHandler } from '@matrixai/logger';
import { generateVaultId, generateVaultKey } from '@/vaults/utils';
import { getRandomBytes } from '@/keys/utils';
import { WorkerManager } from '@/workers';
import { EncryptedFS } from 'encryptedfs';
import * as errors from '@/vaults/errors';
import * as utils from '@/utils';

describe('Vault is', () => {
  let dataDir: string;
  let vault: Vault;
  let key: Buffer;
  let vaultId: string;
  let efsDir: string;
  const logger = new Logger('Vault', LogLevel.WARN, [new StreamHandler()]);
  const name = 'vault-1';

  beforeEach(async () => {
    dataDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'polykey-test-'),
    );
    key = await generateVaultKey();
    vaultId = await generateVaultId();
    efsDir = path.join(dataDir, vaultId);
    await fs.promises.mkdir(efsDir);
    vault = new Vault({
      vaultId: vaultId,
      vaultName: name,
      baseDir: efsDir,
      filesystem: fs,
      logger: logger,
    });
  });

  afterEach(async () => {
    await fs.promises.rm(dataDir, {
      force: true,
      recursive: true,
    });
  });

  test('type correct', async () => {
    expect(vault).toBeInstanceOf(Vault);
  });
  test('creating the vault directory', async () => {
    await vault.start({ key });
    await expect(fs.promises.readdir(dataDir)).resolves.toContain(vaultId);
  });
  test('able to destroy an empty vault', async () => {
    await vault.start({ key });
    await expect(fs.promises.readdir(dataDir)).resolves.toContain(vaultId);
    await vault.stop();
    await expect(fs.promises.readdir(dataDir)).resolves.not.toContain(vaultId);
  });
  test('adding a secret', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.toContain('secret-1.data');
    await vault.stop();
  });
  test('adding a secret and getting it', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    const secret = await vault.getSecret('secret-1');
    expect(secret).toBe('secret-content');
    await expect(vault.getSecret('doesnotexist')).rejects.toThrow(
      errors.ErrorSecretUndefined,
    );
    await vault.stop();
  });
  test('able to make directories', async () => {
    await vault.start({ key });
    await vault.mkdir('dir-1', { recursive: true });
    await vault.mkdir('dir-2', { recursive: true });
    await vault.mkdir(path.join('dir-3', 'dir-4'), { recursive: true });
    await vault.addSecret(
      path.join('dir-3', 'dir-4', 'secret-1'),
      'secret-content',
    );
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.toContain('dir-1.data');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.toContain('dir-2.data');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId, 'dir-3.data')))
      .resolves.toContain('dir-4.data');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId, 'dir-3.data', 'dir-4.data')))
      .resolves.toContain('secret-1.data');
    await vault.stop();
  });
  test('adding and committing a secret 10 times', async () => {
    await vault.start({ key });
    for (let i = 0; i < 10; i++) {
      const name = 'secret ' + i.toString();
      const content = 'secret-content';
      await vault.addSecret(name, content);
      await expect(vault.getSecret(name)).resolves.toStrictEqual(content);
      await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
        .resolves.toContain(`${name}.data`);
    }
    await vault.stop();
  });
  test('updating secret content', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await vault.updateSecret(
      'secret-1',
      'secret-content-change',
    );
    await expect(vault.getSecret('secret-1')).resolves.toStrictEqual(
      'secret-content-change',
    );
    await vault.stop();
  });
  test('updating secret content within a directory', async () => {
    await vault.start({ key });
    await vault.mkdir(path.join('dir-1', 'dir-2'), { recursive: true });
    await vault.addSecret(
      path.join('dir-1', 'dir-2', 'secret-1'),
      'secret-content',
    );
    await vault.updateSecret(
      path.join('dir-1', 'dir-2', 'secret-1'),
      'secret-content-change',
    );
    await expect(
      vault.getSecret(path.join('dir-1', 'dir-2', 'secret-1')),
    ).resolves.toStrictEqual('secret-content-change');
    await vault.stop();
  });
  test('updating a secret 10 times', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    for (let i = 0; i < 10; i++) {
      const content = 'secret-content';
      await vault.updateSecret('secret-1', content);
      await expect(vault.getSecret('secret-1')).resolves.toStrictEqual(
        content,
      );
    }
    await vault.stop();
  });
  test('deleting a secret', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await vault.deleteSecret('secret-1', { recursive: false });
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.not.toContain('secret-1.data');
    await vault.stop();
  });
  test('deleting a secret within a directory', async () => {
    await vault.start({ key });
    await vault.mkdir(path.join('dir-1', 'dir-2'), { recursive: true });
    await vault.addSecret(
      path.join('dir-1', 'dir-2', 'secret-1'),
      'secret-content',
    );
    await vault.deleteSecret(path.join('dir-1', 'dir-2'), { recursive: true });
    await expect(fs.promises.readdir(path.join(dataDir, vaultId, 'dir-1.data')))
      .resolves.not.toContain('dir2-1.data');
    await vault.stop();
  });
  test('deleting a secret 10 times', async () => {
    await vault.start({ key });
    for (let i = 0; i < 10; i++) {
      const name = 'secret ' + i.toString();
      const content = 'secret-content';
      await vault.addSecret(name, content);
      await expect(vault.getSecret(name)).resolves.toStrictEqual(content);
      await vault.deleteSecret(name, { recursive: true });
      await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
        .resolves.not.toContain(`${name}.data`);
    }
    await vault.stop();
  });
  test('renaming a vault', async () => {
    await vault.start({ key });
    await vault.renameVault('vault-change');
    expect(vault.vaultName).toEqual('vault-change');
    await vault.stop();
  });
  test('renaming a secret', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await vault.renameSecret('secret-1', 'secret-change');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.not.toContain('secret-1.data');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId)))
      .resolves.toContain('secret-change.data');
    await vault.stop();
  });
  test('renaming a secret within a directory', async () => {
    await vault.start({ key });
    await vault.mkdir(path.join('dir-1', 'dir-2'), { recursive: true });
    await vault.addSecret(
      path.join('dir-1', 'dir-2', 'secret-1'),
      'secret-content',
    );
    await vault.renameSecret(
      path.join('dir-1', 'dir-2', 'secret-1'),
      path.join('dir-1', 'dir-2', 'secret-change'),
    );
    await expect(
      fs.promises.readdir(path.join(dataDir, vaultId, 'dir-1.data', 'dir-2.data')),
    ).resolves.toContain(`secret-change.data`);
    await vault.stop();
  });
  test('listing secrets', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await vault.addSecret('secret-2', 'secret-content');
    await vault.mkdir(path.join('dir1', 'dir2'), { recursive: true });
    await vault.addSecret(
      path.join('dir1', 'dir2', 'secret-3'),
      'secret-content',
    );
    expect((await vault.listSecrets()).sort()).toStrictEqual(
      ['secret-1', 'secret-2', 'dir1/dir2/secret-3'].sort(),
    );
    await vault.stop();
  });
  test('listing secret directories', async () => {
    const secretDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'secret-directory-'),
    );
    const secretDirName = path.basename(secretDir);
    for (let i = 0; i < 10; i++) {
      const name = 'secret ' + i.toString();
      const content = await getRandomBytes(5);
      await fs.promises.writeFile(path.join(secretDir, name), content);
    }
    await vault.start({ key });
    await vault.addSecretDirectory(secretDir);
    expect(await vault.listSecrets()).toStrictEqual([
      path.join(secretDirName, `secret 0`),
      path.join(secretDirName, `secret 1`),
      path.join(secretDirName, `secret 2`),
      path.join(secretDirName, `secret 3`),
      path.join(secretDirName, `secret 4`),
      path.join(secretDirName, `secret 5`),
      path.join(secretDirName, `secret 6`),
      path.join(secretDirName, `secret 7`),
      path.join(secretDirName, `secret 8`),
      path.join(secretDirName, `secret 9`),
    ]);
    await vault.stop();
    await fs.promises.rm(secretDir, {
      force: true,
      recursive: true,
    });
  });
  test('adding hidden files and directories', async () => {
    await vault.start({ key });
    await vault.addSecret('.hiddenSecret', 'hidden_contents');
    await vault.mkdir('.hiddenDir', { recursive: true });
    await vault.addSecret(
      '.hiddenDir/.hiddenInSecret',
      'hidden_inside',
    );
    const list = await vault.listSecrets();
    expect(list.sort()).toStrictEqual(
      ['.hiddenSecret', '.hiddenDir/.hiddenInSecret'].sort(),
    );
    await vault.stop();
  });
  test('updating and deleting hidden files and directories', async () => {
    await vault.start({ key });
    await vault.addSecret('.hiddenSecret', 'hidden_contents');
    await vault.mkdir('.hiddenDir', { recursive: true });
    await vault.addSecret(
      '.hiddenDir/.hiddenInSecret',
      'hidden_inside',
    );
    await vault.updateSecret('.hiddenSecret', 'change_contents');
    await vault.updateSecret(
      '.hiddenDir/.hiddenInSecret',
      'change_inside',
    );
    await vault.renameSecret('.hiddenSecret', '.hidingSecret');
    await vault.renameSecret('.hiddenDir', '.hidingDir');
    let list = await vault.listSecrets();
    expect(list.sort()).toStrictEqual(
      ['.hidingSecret', '.hidingDir/.hiddenInSecret'].sort(),
    );
    await expect(vault.getSecret('.hidingSecret')).resolves.toStrictEqual(
      'change_contents',
    );
    await expect(
      vault.getSecret('.hidingDir/.hiddenInSecret'),
    ).resolves.toStrictEqual('change_inside');
    await vault.deleteSecret('.hidingSecret', { recursive: true });
    await vault.deleteSecret('.hidingDir', { recursive: true });
    list = await vault.listSecrets();
    expect(list.sort()).toStrictEqual([].sort());
    await vault.stop();
  });
  test('adding and committing a secret 100 times on efs', async () => {
    const efs = new EncryptedFS(await getRandomBytes(32), fs, dataDir);
    const exists = utils.promisify(efs.exists).bind(efs);
    const mkdir = utils.promisify(efs.mkdir).bind(efs);
    const writeFile = utils.promisify(efs.writeFile).bind(efs);
    const vaultId = vault.vaultId;
    await mkdir(path.join(dataDir, vaultId), {
      recursive: true,
    });
    await git.init({
      fs: efs,
      dir: path.join(dataDir, vaultId),
    });
    await git.commit({
      fs: efs,
      dir: path.join(dataDir, vaultId),
      author: {
        name: vaultId,
      },
      message: 'Initial Commit',
    });
    await writeFile(
      path.join(path.join(dataDir, vaultId), '.git', 'packed-refs'),
      '# pack-refs with: peeled fully-peeled sorted',
    );
    for (let i = 0; i < 100; i++) {
      const name = 'secret ' + i.toString();
      const content = await getRandomBytes(5);
      const writePath = path.join(dataDir, vaultId, name);
      await writeFile(writePath, content, {});
      await git.add({
        fs: efs,
        dir: path.join(dataDir, vaultId),
        filepath: name,
      });
      await git.commit({
        fs: efs,
        dir: path.join(dataDir, vaultId),
        author: {
          name: vaultId,
        },
        message: `Add secret: ${name}`,
      });

      await expect(exists(path.join(dataDir, vaultId, name))).resolves.toBe(
        true,
      );
    }
  });
  test('adding a directory of 1 secret', async () => {
    const secretDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'secret-directory-'),
    );
    const secretDirName = path.basename(secretDir);
    const name = 'secret';
    const content = await getRandomBytes(5);
    await fs.promises.writeFile(path.join(secretDir, name), content);
    await vault.start({ key });
    await vault.addSecretDirectory(path.join(secretDir));
    await expect(
      fs.promises.readdir(path.join(dataDir, vaultId, `${secretDirName}.data`))
    ).resolves.toContain('secret.data');
    await vault.stop();
    await fs.promises.rm(secretDir, {
      force: true,
      recursive: true,
    });
  });
  test('getting the stats of a vault', async () => {
    await vault.start({ key });
    const stats = await vault.stats();
    expect(stats).toBeInstanceOf(fs.Stats);
    await vault.stop();
  });
  test('adding a directory with subdirectories and files', async () => {
    const secretDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'secret-directory-'),
    );
    const secretDirName = path.basename(secretDir);
    await fs.promises.mkdir(path.join(secretDir, 'dir1'));
    await fs.promises.mkdir(path.join(secretDir, 'dir1', 'dir2'));
    await fs.promises.mkdir(path.join(secretDir, 'dir3'));

    await fs.promises.writeFile(path.join(secretDir, 'secret1'), 'secret1');
    await fs.promises.writeFile(
      path.join(secretDir, 'dir1', 'secret2'),
      'secret2',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir1', 'dir2', 'secret3'),
      'secret3',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir3', 'secret4'),
      'secret4',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir3', 'secret5'),
      'secret5',
    );
    await vault.start({ key });
    await vault.addSecretDirectory(path.join(secretDir));
    const list = await vault.listSecrets();
    expect(list.sort()).toStrictEqual(
      [
        path.join(secretDirName, 'secret1'),
        path.join(secretDirName, 'dir1', 'secret2'),
        path.join(secretDirName, 'dir1', 'dir2', 'secret3'),
        path.join(secretDirName, 'dir3', 'secret4'),
        path.join(secretDirName, 'dir3', 'secret5'),
      ].sort(),
    );
    await vault.stop();
    await fs.promises.rm(secretDir, {
      force: true,
      recursive: true,
    });
  });
  test('testing the errors handling of adding secret directories', async () => {
    const secretDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'secret-directory-'),
    );
    const secretDirName = path.basename(secretDir);
    await fs.promises.mkdir(path.join(secretDir, 'dir1'));
    await fs.promises.mkdir(path.join(secretDir, 'dir1', 'dir2'));
    await fs.promises.mkdir(path.join(secretDir, 'dir3'));
    await fs.promises.writeFile(path.join(secretDir, 'secret1'), 'secret1');
    await fs.promises.writeFile(
      path.join(secretDir, 'dir1', 'secret2'),
      'secret2',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir1', 'dir2', 'secret3'),
      'secret3',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir3', 'secret4'),
      'secret4',
    );
    await fs.promises.writeFile(
      path.join(secretDir, 'dir3', 'secret5'),
      'secret5',
    );
    await vault.start({ key });
    await vault.mkdir(secretDirName, { recursive: true });
    await vault.addSecret(
      path.join(secretDirName, 'secret1'),
      'blocking-secret',
    );
    await vault.addSecretDirectory(secretDir);
    const list = await vault.listSecrets();
    expect(list.sort()).toStrictEqual(
      [
        path.join(secretDirName, 'secret1'),
        path.join(secretDirName, 'dir1', 'secret2'),
        path.join(secretDirName, 'dir1', 'dir2', 'secret3'),
        path.join(secretDirName, 'dir3', 'secret4'),
        path.join(secretDirName, 'dir3', 'secret5'),
      ].sort(),
    );
    await vault.start({ key });
    await fs.promises.rm(secretDir, {
      force: true,
      recursive: true,
    });
  });
  test('adding a directory of 100 secrets with some secrets already existing', async () => {
    const secretDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'secret-directory-'),
    );
    const secretDirName = path.basename(secretDir);
    for (let i = 0; i < 50; i++) {
      const name = 'secret ' + i.toString();
      const content = 'this is secret ' + i.toString();
      await fs.promises.writeFile(
        path.join(secretDir, name),
        Buffer.from(content),
      );
    }
    await vault.start({ key });
    await vault.mkdir(secretDirName, { recursive: false });
    await vault.addSecret(path.join(secretDirName, 'secret 8'), 'secret-content');
    await vault.addSecret(path.join(secretDirName, 'secret 9'), 'secret-content');
    await vault.addSecretDirectory(secretDir);

    for (let j = 0; j < 8; j++) {
      await expect(
        fs.promises.readdir(
          path.join(dataDir, vaultId, `${secretDirName}.data`))
      ).resolves.toContain('secret ' + j.toString() + '.data');
    }
    await expect(
      vault.getSecret(path.join(secretDirName, 'secret 8')))
      .resolves.toStrictEqual('this is secret 8');
    await expect(
      vault.getSecret(path.join(secretDirName, 'secret 9')))
      .resolves.toStrictEqual('this is secret 9');
    await vault.stop();
    await fs.promises.rm(secretDir, {
      force: true,
      recursive: true,
    });
  });
  test('able to persist data across multiple vault objects', async () => {
    await vault.start({ key });
    await vault.addSecret('secret-1', 'secret-content');
    await expect(fs.promises.readdir(path.join(dataDir, vaultId))).resolves.toContain(
      'secret-1.data',
    );
    const vault2 = new Vault({
      vaultId: vaultId,
      vaultName: name,
      baseDir: efsDir,
      filesystem: fs,
      logger: logger,
    });
    await vault2.start({ key });
    const content = await vault2.getSecret('secret-1');
    expect(content).toBe('secret-content');
    await vault2.stop();
  });
});
