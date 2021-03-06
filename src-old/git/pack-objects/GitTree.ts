import {
  ErrorGitUnrecognisedFile,
  ErrorGitUnrecognisedType,
} from '../../errors';
/*::
type TreeEntry = {
  mode: string,
  path: string,
  oid: string,
  type?: string
}
*/

function parseBuffer(buffer) {
  const _entries: any[] = [];
  let cursor = 0;
  while (cursor < buffer.length) {
    const space = buffer.indexOf(32, cursor);
    if (space === -1) {
      throw new ErrorGitUnrecognisedType(
        `GitTree: Error parsing buffer at byte location ${cursor}: Could not find the next space character.`,
      );
    }
    const nullchar = buffer.indexOf(0, cursor);
    if (nullchar === -1) {
      throw new ErrorGitUnrecognisedType(
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

function limitModeToAllowed(mode) {
  if (typeof mode === 'number') {
    mode = mode.toString(8);
  }
  // tree
  if (mode.match(/^0?4.*/)) return '40000'; // Directory
  if (mode.match(/^1006.*/)) return '100644'; // Regular non-executable file
  if (mode.match(/^1007.*/)) return '100755'; // Regular executable file
  if (mode.match(/^120.*/)) return '120000'; // Symbolic link
  if (mode.match(/^160.*/)) return '160000'; // Commit (git submodule reference)
  throw new ErrorGitUnrecognisedFile(`Could not understand file mode: ${mode}`);
}

function nudgeIntoShape(entry) {
  if (!entry.oid && entry.sha) {
    entry.oid = entry.sha; // Github
  }
  entry.mode = limitModeToAllowed(entry.mode); // index
  if (!entry.type) {
    entry.type = 'blob'; // index
  }
  return entry;
}

class GitTree {
  /* ::
  _entries: Array<TreeEntry>
  */
  _entries: any[];
  constructor(entries) {
    if (Buffer.isBuffer(entries)) {
      this._entries = parseBuffer(entries);
    } else if (Array.isArray(entries)) {
      this._entries = entries.map(nudgeIntoShape);
    } else {
      throw new ErrorGitUnrecognisedType(
        'invalid type passed to GitTree constructor',
      );
    }
  }

  static from(tree) {
    return new GitTree(tree);
  }

  render() {
    return this._entries
      .map(
        (entry) => `${entry.mode} ${entry.type} ${entry.oid}    ${entry.path}`,
      )
      .join('\n');
  }

  toObject() {
    return Buffer.concat(
      this._entries.map((entry) => {
        const mode = Buffer.from(entry.mode.replace(/^0/, ''));
        const space = Buffer.from(' ');
        const path = Buffer.from(entry.path);
        // let path = Buffer.from(entry.path, { encoding: 'utf8' })
        const nullchar = Buffer.from([0]);
        const oid = Buffer.from(
          entry.oid.match(/../g).map((n) => parseInt(n, 16)),
        );
        return Buffer.concat([mode, space, path, nullchar, oid]);
      }),
    );
  }

  entries() {
    return this._entries;
  }

  *[Symbol.iterator]() {
    for (const entry of this._entries) {
      yield entry;
    }
  }
}

export default GitTree;
