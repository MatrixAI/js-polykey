import type { PassThrough } from 'readable-stream';

type Config = {
  line: string;
  ref?: string;
  peeled?: string;
  oid?: string;
  comment?: boolean;
};

type Refs = {
  [key: string]: any;
};

type SymRefs = {
  [key: string]: any;
};

type RefsAdResponse = {
  capabilities: Array<string>;
  refs: Refs;
  symrefs: SymRefs;
};

type Ack = {
  oid: string;
};

type Packfile = {
  [key: string]: any;
};

type TreeObj = {
  oid?: string;
  mode?: string;
  path?: string;
  sha?: string;
  buffer: Buffer;
}

type Pack = {
  packstream: PassThrough;
  shallows: Set<string>;
  unshallows: Set<string>;
  acks: Array<Ack>;
}

type Commit = {
  type?: string;
  format?: string;
  source?: string;
  object: TreeObj;
}

type Wrap = {
  oid: string;
  buffer: Buffer;
}

type BufferEncoding =
  | 'utf8'
  | 'hex'
  | 'ascii'
  | 'utf-8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'latin1'
  | 'binary';

export type {
  Config,
  Refs,
  RefsAdResponse,
  Ack,
  Packfile,
  BufferEncoding,
  TreeObj,
  Pack,
  Commit,
  Wrap,
};
