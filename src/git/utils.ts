import type {
  Refs,
  RefsAdResponse,
  Ack,
  Packfile,
  BufferEncoding,
  TreeObj,
  Pack,
  Commit,
  Wrap,
  Blobs,
} from './types';

import { EncryptedFS } from 'encryptedfs';
import path from 'path';
import fs from 'fs';
import pako from 'pako';
import Hash from 'sha.js/sha1';
import { PassThrough } from 'readable-stream';
import createHash from 'sha.js';

import * as utils from '../utils';
import * as vaultUtils from '../vaults/utils';
import { errors as gitErrors} from './';

const refpaths = (ref: string) => [
  `${ref}`,
  `refs/${ref}`,
  `refs/tags/${ref}`,
  `refs/heads/${ref}`,
  `refs/remotes/${ref}`,
  `refs/remotes/${ref}/HEAD`,
];

const types = {
  commit: 0b0010000,
  tree: 0b0100000,
  blob: 0b0110000,
  tag: 0b1000000,
  ofs_delta: 0b1100000,
  ref_delta: 0b1110000,
};

// @see https://git-scm.com/docs/gitrepository-layout
const GIT_FILES = ['config', 'description', 'index', 'shallow', 'commondir'];

/**
 * Converts a buffer into an iterator expected by isomorphic git.
 * @param data Data to be turned into an iterator
 */
function iteratorFromData(data: Uint8Array) {
  let ended = false;
  return {
    async next() {
      if (ended) {
        return { done: true };
      } else {
        ended = true;
        return { value: data, done: false };
      }
    },
  };
}

function createGitPacketLine(line: string): string {
  const hexPrefix = (4 + line.length).toString(16);
  return Array(4 - hexPrefix.length + 1).join('0') + hexPrefix + line;
}

async function writeRefsAdResponse(
  info: RefsAdResponse,
): Promise<Array<Buffer>> {
  const stream: Buffer[] = [];
  // Compose capabilities string
  let syms = '';
  let a;
  for (const [key, value] of Object.entries(info.symrefs)) {
    syms += `symref=${key}:${value} `;
    a = value;
  }
  let caps = `\x00${[...info.capabilities].join(
    ' ',
  )} ${syms}agent=git/isomorphic-git@1.8.1`;
  // stream.write(GitPktLine.encode(`# service=${service}\n`))
  // stream.write(GitPktLine.flush())
  // Note: In the edge case of a brand new repo, zero refs (and zero capabilities)
  // are returned.
  for (const [key, value] of Object.entries(info.refs)) {
    stream.push(encode(`${value} ${key}${caps}\n`));
    // This is dodgy, need to find out why this has to be included
    stream.push(encode(`${value} ${a}\n`));
    caps = '';
  }
  stream.push(Buffer.from('0000', 'utf8'));
  return stream;
}

function encode(line: string | Buffer): Buffer {
  if (typeof line === 'string') {
    line = Buffer.from(line);
  }
  const length = line.length + 4;
  const hexlength = padHex(4, length);
  return Buffer.concat([Buffer.from(hexlength, 'utf8'), line]);
}

function padHex(bytes: number, length: number): string {
  const s = length.toString(16);
  return '0'.repeat(bytes - s.length) + s;
}

function compareRefNames(refa: string, refb: string): number {
  // https://stackoverflow.com/a/40355107/2168416
  const _a = refa.replace(/\^\{\}$/, '');
  const _b = refb.replace(/\^\{\}$/, '');
  const tmp = -(_a < _b) || +(_a > _b);
  if (tmp === 0) {
    return refa.endsWith('^{}') ? 1 : -1;
  }
  return tmp;
}

function textToPackedRefs(text: string): Refs {
  const refs: Refs = [];
  if (text) {
    let key: string;
    text
      .trim()
      .split('\n')
      .map((line) => {
        if (/^\s*#/.test(line)) {
          return { line: line, comment: true };
        }
        const i = line.indexOf(' ');
        if (line.startsWith('^')) {
          // This is a oid for the commit associated with the annotated tag immediately preceding this line.
          // Trim off the '^'
          const value = line.slice(1);
          // The tagname^{} syntax is based on the output of `git show-ref --tags -d`
          this.refs[key + '^{}'] = value;
          return { line: line, ref: key, peeled: value };
        } else {
          // This is an oid followed by the ref name
          const value = line.slice(0, i);
          key = line.slice(i + 1);
          this.refs[key] = value;
          return { line: line, ref: key, oid: value };
        }
      });
  }
  return refs;
}

async function packedRefs(fs: EncryptedFS, gitdir: string): Promise<Refs> {
  const readFile = utils.promisify(fs.readFile).bind(fs);
  const text = await readFile(path.join(gitdir, 'packed-refs'), {
    encoding: 'utf8',
  });
  const refs = textToPackedRefs(text.toString());
  return refs;
}

async function listRefs(
  fs: EncryptedFS,
  gitdir: string,
  filepath: string,
): Promise<string[]> {
  const packedMap = packedRefs(fs, gitdir);
  let files: string[] = [];
  try {
    for (const file of await vaultUtils.readdirRecursivelyEFS(fs, path.join(gitdir, filepath))) {
      files.push(file);
    }
    files = files.map((x) => x.replace(path.join(gitdir, filepath, '/'), ''));
  } catch (err) {
    files = [];
  }

  for (let key of (await packedMap).keys()) {
    // filter by prefix
    if (key.startsWith(filepath)) {
      // remove prefix
      key = key.replace(filepath + '/', '');
      // Don't include duplicates; the loose files have precedence anyway
      if (!files.includes(key)) {
        files.push(key);
      }
    }
  }
  // since we just appended things onto an array, we need to sort them now
  files.sort(compareRefNames);
  return files;
}

async function resolve(
  fs: EncryptedFS,
  gitdir: string,
  ref: string,
  depth?: number,
): Promise<string> {
  const readFile = utils.promisify(fs.readFile).bind(fs);
  if (depth !== undefined) {
    depth--;
    if (depth === -1) {
      return ref;
    }
  }
  // Is it a ref pointer?
  if (ref.startsWith('ref: ')) {
    ref = ref.slice('ref: '.length);
    return resolve(fs, gitdir, ref, depth);
  }
  // Is it a complete and valid SHA?
  if (ref.length === 40 && /[0-9a-f]{40}/.test(ref)) {
    return ref;
  }
  // We need to alternate between the file system and the packed-refs
  const packedMap = await packedRefs(fs, gitdir);
  // Look in all the proper paths, in this order
  const allpaths = refpaths(ref).filter((p) => !GIT_FILES.includes(p)); // exclude git system files (#709)
  for (const ref of allpaths) {
    const sha = (await readFile(path.join(gitdir, ref), { encoding: 'utf8' })).toString()
      || packedMap.get(ref);
    if (sha) {
      return resolve(fs, gitdir, sha.trim(), depth);
    }
  }
  throw new gitErrors.ErrorGitUndefinedRefs('Refs not found');
}

async function uploadPack(
  fs: EncryptedFS,
  gitdir: string = '.git',
  advertiseRefs = false,
): Promise<Array<Buffer> | undefined> {
  try {
    if (advertiseRefs) {
      const capabilities = ['side-band-64k'];
      let keys = await listRefs(fs, gitdir, 'refs');
      keys = keys.map((ref) => path.join('refs', ref));
      const refs = {};
      keys.unshift('HEAD');
      for (const key of keys) {
        refs[key] = await resolve(fs, gitdir, key);
      }
      const symrefs = {};
      symrefs['HEAD'] = await resolve(fs, gitdir, 'HEAD', 2);
      const write: RefsAdResponse = {
        capabilities: capabilities,
        refs: refs,
        symrefs: symrefs,
      };
      return writeRefsAdResponse(write);
    }
  } catch (err) {
    err.caller = 'git.uploadPack';
    throw err;
  }
}

async function packObjects(
  fs: EncryptedFS,
  gitdir: string = '.git',
  refs: string[],
  depth?: number,
  haves?: string[],
): Promise<Pack> {
  const oids = new Set<string>();
  const shallows = new Set<string>();
  const unshallows = new Set<string>();
  const acks: Ack[] = [];
  haves = haves ? haves : [];
  const since = undefined;
  for (const ref of refs) {
    const commits = await log(
      fs,
      gitdir,
      ref,
      depth,
      since,
    );
    const oldshallows: string[] = [];
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      if (haves.includes(commit.oid)) {
        acks.push({
          oid: ref,
        });
        break;
      }
      oids.add(commit.oid);
      if (i === commits.length - 1) {
        if (
          !oldshallows.includes(commit.oid) &&
          (depth !== undefined || since !== undefined)
        ) {
          shallows.add(commit.oid);
        }
      } else if (oldshallows.includes(commit.oid)) {
        unshallows.add(commit.oid);
      }
    }
  }
  const objects = await listObjects(fs, gitdir, Array.from(oids));
  const packstream = new PassThrough();
  pack(fs, gitdir, [...objects], packstream);
  return { packstream, shallows, unshallows, acks };
}

async function listObjects(
  fs: EncryptedFS,
  gitdir = '.git',
  oids: string[],
): Promise<Array<string>> {
  const commits = new Set<string>();
  const trees = new Set<string>();
  const blobs = new Set<string>();

  // We don't do the purest simplest recursion, because we can
  // avoid reading Blob objects entirely since the Tree objects
  // tell us which oids are Blobs and which are Trees. And we
  // do not need to recurse through commit parents.
  async function walk(oid: string): Promise<void> {
    const { type, object } = await read(fs, gitdir, oid);
    if (type === 'commit') {
      commits.add(oid);
      const commit = commitFrom(object);
      const tree = parseHeaders(commit).tree;
      await walk(tree);
    } else if (type === 'tree') {
      trees.add(oid);
      const tree = treeFrom(object);
      for (const entry of tree) {
        if (entry.type === 'blob') {
          blobs.add(entry.oid);
        }
        // only recurse for trees
        if (entry.type === 'tree') {
          await walk(entry.oid);
        }
      }
    }
  }

  // Let's go walking!
  for (const oid of oids) {
    await walk(oid);
  }
  return [...commits, ...trees, ...blobs];
}

function treeFrom(entries: Blobs): Array<TreeObj> {
  let entriesa: Array<TreeObj> = [];
  if (Buffer.isBuffer(entries)) {
    entriesa = parseBuffer(entries);
  } else if (Array.isArray(entries)) {
    entriesa = entries.map(nudgeIntoShape);
  } else {
    throw new Error('invalid type passed to GitTree constructor');
  }
  return entriesa;
}

function nudgeIntoShape(entry: Blobs): TreeObj {
  if (!entry.oid && entry.sha) {
    entry.oid = entry.sha; // Github
  }
  entry.mode = limitModeToAllowed(entry.mode); // index
  if (!entry.type) {
    entry.type = 'blob'; // index
  }
  return entry;
}

function limitModeToAllowed(mode: string | number): string {
  if (typeof mode === 'number') {
    mode = mode.toString(8);
  }
  // tree
  if (mode.match(/^0?4.*/)) return '40000'; // Directory
  if (mode.match(/^1006.*/)) return '100644'; // Regular non-executable file
  if (mode.match(/^1007.*/)) return '100755'; // Regular executable file
  if (mode.match(/^120.*/)) return '120000'; // Symbolic link
  if (mode.match(/^160.*/)) return '160000'; // Commit (git submodule reference)
  throw new gitErrors.ErrorGitUndefinedFileMode(`Could not understand file mode: ${mode}`);
}

function parseBuffer(buffer: Buffer): Array<TreeObj> {
  const _entries: TreeObj[] = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const space = buffer.indexOf(32, cursor);
    if (space === -1) {
      throw new gitErrors.ErrorGitBufferParse(
        `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`,
      );
    }
    const nullchar = buffer.indexOf(0, cursor);
    if (nullchar === -1) {
      throw new gitErrors.ErrorGitBufferParse(
        `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next null character.`,
      );
    }
    let mode = buffer.slice(cursor, space).toString('utf8');
    if (mode === '40000') mode = '040000'; // makes it line up neater in printed output
    const type = mode === '040000' ? 'tree' : 'blob';
    const path = buffer.slice(space + 1, nullchar).toString('utf8');
    const oid = buffer.slice(nullchar + 1, nullchar + 21).toString('hex');
    cursor = nullchar + 21;
    _entries.push({ mode, path, oid, type });
  }
  return _entries;
}

async function log(
  fs: EncryptedFS,
  gitdir = '.git',
  ref = 'HEAD',
  depth: number | undefined,
  since: number | undefined, // Date
  signing = false,
): Promise<Array<Commit>> {
  try {
    const sinceTimestamp =
      since === undefined ? undefined : Math.floor(since.valueOf() / 1000);
    // TODO: In the future, we may want to have an API where we return a
    // async iterator that emits commits.
    const commits: Commit[] = [];
    const oid = await resolve(fs, gitdir, ref);
    const tips = [await logCommit(fs, gitdir, oid, signing)];

    // eslint-disable-next-line
    while (true) {
      const commit = tips.pop();

      // Stop the loop if we encounter an error
      if (commit.error) {
        commits.push(commit);
        break;
      }

      // Stop the log if we've hit the age limit
      if (
        sinceTimestamp !== undefined &&
        commit.committer.timestamp <= sinceTimestamp
      ) {
        break;
      }

      commits.push(commit);

      // Stop the loop if we have enough commits now.
      if (depth !== undefined && commits.length === depth) break;

      // Add the parents of this commit to the queue
      // Note: for the case of a commit with no parents, it will concat an empty array, having no net effect.
      for (const oid of commit.parent) {
        const commit = await logCommit(fs, gitdir, oid, signing);
        if (!tips.map((commit) => commit.oid).includes(commit.oid)) {
          tips.push(commit);
        }
      }

      // Stop the loop if there are no more commit parents
      if (tips.length === 0) break;

      // Process tips in order by age
      tips.sort(compareAge);
    }
    return commits;
  } catch (err) {
    err.caller = 'git.log';
    throw err;
  }
}

function compareAge(a, b) {
  return a.committer.timestamp - b.committer.timestamp;
}

async function logCommit(
  fs: EncryptedFS,
  gitdir: string,
  oid: string,
  signing: boolean,
) {
  try {
    const { type, object } = await read(fs, gitdir, oid);
    if (type !== 'commit') {
      throw new Error('expected type to be commit');
    }
    const commit = commitFrom(object);
    const result = Object.assign({ oid }, parse(commit));
    if (signing) {
      result.payload = withoutSignature(commit);
    }
    return result;
  } catch (err) {
    return {
      oid,
      error: err,
    };
  }
}

function withoutSignature(commit: string) {
  const commita = normalize(commit);
  if (commita.indexOf('\ngpgsig') === -1) return commita;
  const headers = commita.slice(0, commita.indexOf('\ngpgsig'));
  const message = commita.slice(
    commita.indexOf('-----END PGP SIGNATURE-----\n') +
      '-----END PGP SIGNATURE-----\n'.length,
  );
  return normalize(headers + '\n' + message);
}
function justMessage(commit: string) {
  return normalize(commit.slice(commit.indexOf('\n\n') + 2));
}

function parse(commit: string) {
  return Object.assign({ message: justMessage(commit) }, parseHeaders(commit));
}

function render(obj) {
  return renderHeaders(obj) + '\n' + normalize(obj.message);
}

function justHeaders(commit: string) {
  return commit.slice(0, commit.indexOf('\n\n'));
}

function parseHeaders(commit: string) {
  const headers = justHeaders(commit).split('\n');
  const hs: string[] = [];
  for (const h of headers) {
    if (h[0] === ' ') {
      // combine with previous header (without space indent)
      hs[hs.length - 1] += '\n' + h.slice(1);
    } else {
      hs.push(h);
    }
  }
  const obj: any = {
    parent: [],
  };
  for (const h of hs) {
    const key = h.slice(0, h.indexOf(' '));
    const value = h.slice(h.indexOf(' ') + 1);
    if (Array.isArray(obj[key])) {
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  if (obj.author) {
    obj.author = parseAuthor(obj.author);
  }
  if (obj.committer) {
    obj.committer = parseAuthor(obj.committer);
  }
  return obj;
}

function parseAuthor(author) {
  const [, name, email, timestamp, offset] = author.match(
    /^(.*) <(.*)> (.*) (.*)$/,
  );
  return {
    name: name,
    email: email,
    timestamp: Number(timestamp),
    timezoneOffset: parseTimezoneOffset(offset),
  };
}

function parseTimezoneOffset(offset) {
  const [, sign, hours, minutes] = offset.match(/(\+|-)(\d\d)(\d\d)/);
  const mins = (sign === '+' ? 1 : -1) * (Number(hours) * 60 + Number(minutes));
  return mins === 0 ? mins : -mins;
}

function normalize(str) {
  // remove all <CR>
  str = str.replace(/\r/g, '');
  // no extra newlines up front
  str = str.replace(/^\n+/, '');
  // and a single newline at the end
  str = str.replace(/\n+$/, '') + '\n';
  return str;
}

function indent(str) {
  return (
    str
      .trim()
      .split('\n')
      .map((x) => ' ' + x)
      .join('\n') + '\n'
  );
}

function renderHeaders(obj) {
  let headers = '';
  if (obj.tree) {
    headers += `tree ${obj.tree}\n`;
  } else {
    headers += `tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904\n`; // the null tree
  }
  if (obj.parent) {
    if (obj.parent.length === undefined) {
      throw new Error(`commit 'parent' property should be an array`);
    }
    for (const p of obj.parent) {
      headers += `parent ${p}\n`;
    }
  }
  const author = obj.author;
  headers += `author ${author.name} <${author.email}> ${
    author.timestamp
  } ${formatTimezoneOffset(author.timezoneOffset)}\n`;
  const committer = obj.committer || obj.author;
  headers += `committer ${committer.name} <${committer.email}> ${
    committer.timestamp
  } ${formatTimezoneOffset(committer.timezoneOffset)}\n`;
  if (obj.gpgsig) {
    headers += 'gpgsig' + indent(obj.gpgsig);
  }
  return headers;
}

function formatTimezoneOffset(minutes) {
  const sign = simpleSign(minutes === 0 ? minutes : -minutes);
  minutes = Math.abs(minutes);
  const hours = Math.floor(minutes / 60);
  minutes -= hours * 60;
  let strHours = String(hours);
  let strMinutes = String(minutes);
  if (strHours.length < 2) strHours = '0' + strHours;
  if (strMinutes.length < 2) strMinutes = '0' + strMinutes;
  return (sign === -1 ? '-' : '+') + strHours + strMinutes;
}

function simpleSign(n) {
  return Math.sign(n) || (Object.is(n, -0) ? -1 : 1);
}

function commitFrom(commit): string {
  let commitRet;
  if (typeof commit === 'string') {
    commitRet = commit;
  } else if (Buffer.isBuffer(commit)) {
    commitRet = commit.toString('utf8');
  } else if (typeof commit === 'object') {
    commitRet = render(commit);
  } else {
    throw new Error('invalid type passed to GitCommit constructor');
  }
  return commitRet;
}

const PackfileCache: Packfile = {};

async function read(
  fs: EncryptedFS,
  gitdir: string,
  oid: string,
  format = 'content',
): Promise<Commit> {
  const readFile = utils.promisify(fs.readFile).bind(fs);
  const readdir = utils.promisify(fs.readdir).bind(fs);
  // Look for it in the loose object directory.
  const file = await readFile(
    path.join(gitdir, 'objects', oid.slice(0, 2), oid.slice(2)),
  );
  const source = path.join('.', 'objects', oid.slice(0, 2), oid.slice(2));
  // Check to see if it's in a packfile.
  if (!file) {
    // Curry the current read method so that the packfile un-deltification
    // process can acquire external ref-deltas.
    const getExternalRefDelta = (oid: string) => read(fs, gitdir, oid);
    // Iterate through all the .pack files
    let list: Array<string> = await readdir(path.join(gitdir, '/objects/pack'));
    list = list.filter((x: string) => x.endsWith('.pack'));
    for (const filename of list) {
      // Try to get the packfile from the in-memory cache
      const p = PackfileCache[filename];
      // If the packfile DOES have the oid we're looking for...
      if (p.offsets.has(oid)) {
        // Make sure the packfile is loaded in memory
        if (!p.pack) {
          const pack: string = await readFile(
            path.join(gitdir, 'objects/pack', filename),
          );
          await p.load({ pack });
        }
        // Get the resolved git object from the packfile
        const result = await p.read({ oid, getExternalRefDelta });
        result.source = path.join('./objects/pack', filename);
        return result;
      }
    }
  }
  // Check to see if it's in shallow commits.
  if (!file) {
    const text: string = await readFile(path.join(gitdir, 'shallow'), {
      encoding: 'utf8',
    });
    if (text !== null && text.includes(oid)) {
      throw new gitErrors.ErrorGitReadObject(`ReadShallowObjectFail: ${oid}`);
    }
  }
  // Finally
  if (!file) {
    throw new gitErrors.ErrorGitReadObject(`ReadObjectFail: ${oid}`);
  }
  if (format === 'deflated') {
    return { format: 'deflated', object: file, source };
  }
  const buffer = Buffer.from(pako.inflate(file));
  if (format === 'wrapped') {
    return { format: 'wrapped', object: { buffer }, source };
  }
  const { type, object } = unwrap({ oid, buffer });
  if (format === 'content') return { type, format: 'content', object, source };
  throw new gitErrors.ErrorGitReadObject(`Unsupported format type: ${format}`);
}

function unwrap(wrap: Wrap): Commit {
  if (wrap.oid) {
    const sha = new Hash().update(wrap.buffer).digest('hex');
    if (sha !== wrap.oid) {
      throw new gitErrors.ErrorGitInvalidSha(
        `SHA check failed! Expected ${wrap.oid}, computed ${sha}`
      );
    }
  }
  const s = wrap.buffer.indexOf(32); // first space
  const i = wrap.buffer.indexOf(0); // first null value
  const type = wrap.buffer.slice(0, s).toString('utf8'); // get type of object
  const length = wrap.buffer.slice(s + 1, i).toString('utf8'); // get type of object
  const actualLength = wrap.buffer.length - (i + 1);
  // verify length
  if (parseInt(length) !== actualLength) {
    throw new gitErrors.ErrorGitType(
      `Length mismatch: expected ${length} bytes but got ${actualLength} instead.`,
    );
  }
  return {
    type: type,
    object: { buffer: Buffer.from(wrap.buffer.slice(i + 1)) },
  };
}

async function pack(
  fs: EncryptedFS,
  gitdir: string = '.git',
  oids: string[],
  outputStream: PassThrough,
): Promise<PassThrough> {
  const hash = createHash('sha1');
  function write(chunk: any, enc?: BufferEncoding) {
    if (enc) {
      outputStream.write(chunk, enc);
    } else {
      outputStream.write(chunk);
    }
    hash.update(chunk, enc);
  }
  function writeObject(object: any, stype: any) {
    // Object type is encoded in bits 654
    const type = types[stype];
    if (type === undefined) throw new gitErrors.ErrorGitType('Unrecognized type: ' + stype);
    // The length encoding get complicated.
    let length = object.length;
    // Whether the next byte is part of the variable-length encoded number
    // is encoded in bit 7
    let multibyte = length > 0b1111 ? 0b10000000 : 0b0;
    // Last four bits of length is encoded in bits 3210
    const lastFour = length & 0b1111;
    // Discard those bits
    length = length >>> 4;
    // The first byte is then (1-bit multibyte?), (3-bit type), (4-bit least sig 4-bits of length)
    let byte: any = (multibyte | type | lastFour).toString(16);
    write(byte, 'hex');
    // Now we keep chopping away at length 7-bits at a time until its zero,
    // writing out the bytes in what amounts to little-endian order.
    while (multibyte) {
      multibyte = length > 0b01111111 ? 0b10000000 : 0b0;
      byte = multibyte | (length & 0b01111111);
      const unpaddedChunk = byte.toString(16);
      const paddedChunk = '0'.repeat(2 - unpaddedChunk.length) + unpaddedChunk;
      write(paddedChunk, 'hex');
      length = length >>> 7;
    }
    // Lastly, we can compress and write the object.
    write(Buffer.from(pako.deflate(object)));
  }

  write('PACK');
  write('00000002', 'hex');
  // Write a 4 byte (32-bit) int
  const unpaddedChunk = oids.length.toString(16);
  const paddedChunk = '0'.repeat(8 - unpaddedChunk.length) + unpaddedChunk;
  write(paddedChunk, 'hex');
  for (const oid of oids) {
    const { type, object } = await read(fs, gitdir, oid);
    writeObject(object, type);
  }
  // Write SHA1 checksum
  const digest = hash.digest();
  outputStream.end(digest);
  return outputStream;
}

function mux(
  protocol: string, // 'side-band' or 'side-band-64k'
  packetlines: PassThrough,
  packfile: PassThrough,
  progress: PassThrough,
): PassThrough {
  const MAX_PACKET_LENGTH = protocol === 'side-band-64k' ? 999 : 65519;
  const output = new PassThrough();
  packetlines.on('data', (data: Buffer) => {
    if (data === null) {
      output.write(Buffer.from('0000', 'utf8'));
    } else {
      output.write(encode(data));
    }
  });
  let packfileWasEmpty = true;
  let packfileEnded = false;
  let progressEnded = false;
  const errorEnded = true;
  const goodbye = Buffer.concat([
    encode(Buffer.from('010A', 'hex')),
    Buffer.from('0000', 'utf8'),
  ]);
  packfile
    .on('data', (data: Buffer) => {
      packfileWasEmpty = false;
      const buffers = splitBuffer(data, MAX_PACKET_LENGTH);
      for (const buffer of buffers) {
        output.write(encode(Buffer.concat([Buffer.from('01', 'hex'), buffer])));
      }
    })
    .on('end', () => {
      packfileEnded = true;
      if (!packfileWasEmpty) output.write(goodbye);
      if (progressEnded && errorEnded) output.end();
    });
  progress
    .on('data', (data: Buffer) => {
      const buffers = splitBuffer(data, MAX_PACKET_LENGTH);
      for (const buffer of buffers) {
        output.write(encode(Buffer.concat([Buffer.from('02', 'hex'), buffer])));
      }
    })
    .on('end', () => {
      progressEnded = true;
      if (packfileEnded && errorEnded) output.end();
    });
  return output;
}

function splitBuffer(buffer: Buffer, maxBytes: number): Array<Buffer> {
  const result: Buffer[] = [];
  let index = 0;
  while (index < buffer.length) {
    const buf = buffer.slice(index, index + maxBytes);
    result.push(buf);
    index += buf.length;
  }
  result.push(buffer.slice(index));
  return result;
}

export {
  createGitPacketLine,
  writeRefsAdResponse,
  uploadPack,
  packObjects,
  mux,
  iteratorFromData,
};
