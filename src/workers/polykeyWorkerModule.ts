import type { PublicKeyAsn1, PrivateKeyAsn1, KeyPairAsn1 } from '../keys/types';

import { utils as keysUtils } from '../keys';
import { isWorkerRuntime } from 'threads/worker';
import efsWorker from 'encryptedfs/dist/workers/efsWorkerModule';

/**
 * Worker object that contains all functions that will be executed in parallel
 * Functions should be using CPU-parallelism not IO-parallelism
 * Most functions should be synchronous, not asynchronous
 * Making them asynchronous does not make a difference to the caller
 * The caller must always await because the fucntions will run on the pool
 */
const polykeyWorker = {
  ...efsWorker,
  /**
   * Check if we are running in the worker.
   * Only used for testing
   */
  isRunningInWorker(): boolean {
    return isWorkerRuntime();
  },
  /**
   * Sleep synchronously
   * This blocks the entire event loop
   * Only used for testing
   */
  sleep(ms: number): void {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    return;
  },
  /**
   * Generate KeyPair
   */
  async generateKeyPairAsn1(bits: number): Promise<KeyPairAsn1> {
    const keyPair = await keysUtils.generateKeyPair(bits);
    return keysUtils.keyPairToAsn1(keyPair);
  },
  encryptWithPublicKeyAsn1(
    publicKeyAsn1: PublicKeyAsn1,
    plainText: string,
  ): string {
    const plainText_ = Buffer.from(plainText, 'binary');
    const publicKey = keysUtils.publicKeyFromAsn1(publicKeyAsn1);
    const cipherText = keysUtils.encryptWithPublicKey(publicKey, plainText_);
    return cipherText.toString('binary');
  },
  decryptWithPrivateKeyAsn1(
    privateKeyAsn1: PrivateKeyAsn1,
    cipherText: string,
  ): string {
    const cipherText_ = Buffer.from(cipherText, 'binary');
    const privateKey = keysUtils.privateKeyFromAsn1(privateKeyAsn1);
    const plainText = keysUtils.decryptWithPrivateKey(privateKey, cipherText_);
    return plainText.toString('binary');
  },
  signWithPrivateKeyAsn1(privateKeyAsn1: PrivateKeyAsn1, data: string): string {
    const data_ = Buffer.from(data, 'binary');
    const privateKey = keysUtils.privateKeyFromAsn1(privateKeyAsn1);
    const signature = keysUtils.signWithPrivateKey(privateKey, data_);
    return signature.toString('binary');
  },
  verifyWithPublicKeyAsn1(
    publicKeyAsn1: PublicKeyAsn1,
    data: string,
    signature: string,
  ): boolean {
    const data_ = Buffer.from(data, 'binary');
    const signature_ = Buffer.from(signature, 'binary');
    const publicKey = keysUtils.publicKeyFromAsn1(publicKeyAsn1);
    const signed = keysUtils.verifyWithPublicKey(publicKey, data_, signature_);
    return signed;
  },
};

type PolykeyWorker = typeof polykeyWorker;

export type { PolykeyWorker };

export default polykeyWorker;
