import { DB } from './src/db';
import fs from 'fs';
import { KeyManager } from './src/keys';

async function run() {
  const domain: string = 'anything';
  const subdomain: Array<string> = [domain, 'subdomain'];

  console.log('asdfasdf');
  const keys = new KeyManager({
    keysPath: './tmp/keys',
    fs: fs,
  });

  const db = new DB({
    dbPath: './tmp/db',
    fs: fs,
  });

  await keys.start({
    password: 'asdf',
  });

  await db.start({
    keyPair: keys.getRootKeyPair(),
  });

  const domainDb = await db.level<string>(domain);

  const subdomainDb = await db.level<string>(subdomain[1], domainDb);

  await db.put<string>([domain], 'something', 'blue');

  await db.put<string>(subdomain, 'key', 'memwemfwamefm');

  await db.put<string>(subdomain, 'key2', 'seof');

  for await (const o of subdomainDb.createReadStream()) {
    console.log(o);
  }
}

run();
