import type { POJO } from './types';

import { CustomError } from 'ts-custom-error';

class ErrorPolykey extends CustomError {
  data: POJO;
  description: string = 'Polykey error';
  exitCode: number = 1;
  constructor(message: string = '', data: POJO = {}) {
    super(message);
    this.data = data;
  }
  toJSON(): string {
    return JSON.stringify({
      name: this.name,
      description: this.description,
      message: this.message,
      exitCode: this.exitCode,
      data: this.data,
      stack: this.stack,
    });
  }
}

class ErrorUndefinedBehaviour extends ErrorPolykey {}

export { ErrorPolykey, ErrorUndefinedBehaviour };

/**
 * Recursively export all domain-level error classes
 * This ensures that we have one place to construct and
 * reference all Polykey errors
 */
export * from './acl/errors';
export * from './db/errors';
export * from './session/errors';
export * from './keys/errors';
export * from './vaults/errors';
export * from './git/errors';
export * from './gestalts/errors';
export * from './identities/errors';
export * from './agent/errors';
export * from './client/errors';
export * from './grpc/errors';
export * from './network/errors';
export * from './nodes/errors';
export * from './workers/errors';
export * from './bootstrap/errors';
export * from './notifications/errors';
