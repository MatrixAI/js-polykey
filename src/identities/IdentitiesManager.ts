import type {
  ProviderId,
  IdentityId,
  ProviderTokens,
  TokenData,
} from './types';
import type { DB } from '../db';
import type { DBLevel } from '../db/types';
import type Provider from './Provider';

import { Mutex } from 'async-mutex';
import Logger from '@matrixai/logger';
import * as identitiesErrors from './errors';
import { errors as dbErrors } from '../db';
import { GithubProvider } from './providers';

class IdentitiesManager {
  public readonly identitiesPath: string;
  public readonly tokenDbPath: string;

  protected logger: Logger;
  protected db: DB;
  protected identitiesDbDomain: string = this.constructor.name;
  protected identitiesTokensDbDomain: Array<string> = [
    this.identitiesDbDomain,
    'tokens',
  ];
  protected identitiesDb: DBLevel<string>;
  protected identitiesTokensDb: DBLevel<ProviderId>;
  protected lock: Mutex = new Mutex();
  protected providers: Map<ProviderId, Provider> = new Map();
  protected _started: boolean = false;

  constructor({ db, logger }: { db: DB; logger?: Logger }) {
    this.logger = logger ?? new Logger(this.constructor.name);
    this.db = db;
  }

  get started(): boolean {
    return this._started;
  }

  get locked(): boolean {
    return this.lock.isLocked();
  }

  async start({
    fresh = false,
  }: {
    fresh?: boolean;
  } = {}) {
    try {
      if (this._started) {
        return;
      }
      this.logger.info('Starting Identities Manager');
      this._started = true;
      if (!this.db.started) {
        throw new dbErrors.ErrorDBNotStarted();
      }
      const identitiesDb = await this.db.level<string>(this.identitiesDbDomain);
      // tokens stores ProviderId -> ProviderTokens
      const identitiesTokensDb = await this.db.level<ProviderId>(
        this.identitiesTokensDbDomain[1],
        identitiesDb,
      );
      if (fresh) {
        await identitiesDb.clear();
        this.providers = new Map();
      }
      this.identitiesDb = identitiesDb;
      this.identitiesTokensDb = identitiesTokensDb;
      this.logger.info('Started Identities Manager');
    } catch (e) {
      this._started = false;
      throw e;
    }
  }

  async stop() {
    this.logger.info('Stopping Identities Manager');
    this._started = false;
    this.logger.info('Stopped Identities Manager');
  }

  /**
   * Run several operations within the same lock
   * This does not ensure atomicity of the underlying database
   * Database atomicity still depends on the underlying operation
   */
  public async transaction<T>(
    f: (identitiesManager: IdentitiesManager) => Promise<T>,
  ): Promise<T> {
    const release = await this.lock.acquire();
    try {
      return await f(this);
    } finally {
      release();
    }
  }

  /**
   * Transaction wrapper that will not lock if the operation was executed
   * within a transaction context
   */
  public async _transaction<T>(f: () => Promise<T>): Promise<T> {
    if (this.lock.isLocked()) {
      return await f();
    } else {
      return await this.transaction(f);
    }
  }

  public getProviders(): Record<ProviderId, Provider> {
    return Object.fromEntries(this.providers);
  }

  public getProvider(pId: ProviderId): Provider | undefined {
    return this.providers.get(pId);
  }

  public registerProvider(p: Provider): void {
    if (this.providers.has(p.id)) {
      throw new identitiesErrors.ErrorProviderDuplicate();
    }
    p.setTokenDb(
      () => this.getTokens(p.id),
      (identityId) => this.getToken(p.id, identityId),
      (identityId, tokenValue) => this.putToken(p.id, identityId, tokenValue),
      (identityId) => this.delToken(p.id, identityId),
    );
    this.providers.set(p.id, p);
  }

  public unregisterProvider(pId: ProviderId): void {
    this.providers.delete(pId);
  }

  public async getTokens(providerId: ProviderId): Promise<ProviderTokens> {
    if (!this._started) {
      throw new identitiesErrors.ErrorIdentitiesManagerNotStarted();
    }
    return await this._transaction(async () => {
      const providerTokens = await this.db.get<ProviderTokens>(
        this.identitiesTokensDbDomain,
        providerId,
      );
      if (providerTokens == null) {
        return {};
      }
      return providerTokens;
    });
  }

  public async getToken(
    providerId: ProviderId,
    identityId: IdentityId,
  ): Promise<TokenData | undefined> {
    if (!this._started) {
      throw new identitiesErrors.ErrorIdentitiesManagerNotStarted();
    }
    return await this._transaction(async () => {
      const providerTokens = await this.db.get<ProviderTokens>(
        this.identitiesTokensDbDomain,
        providerId,
      );
      if (providerTokens == null) {
        return undefined;
      }
      return providerTokens[identityId];
    });
  }

  public async putToken(
    providerId: ProviderId,
    identityId: IdentityId,
    tokenData: TokenData,
  ): Promise<void> {
    if (!this._started) {
      throw new identitiesErrors.ErrorIdentitiesManagerNotStarted();
    }
    return await this._transaction(async () => {
      const providerTokens = await this.getTokens(providerId);
      providerTokens[identityId] = tokenData;
      await this.db.put(
        this.identitiesTokensDbDomain,
        providerId,
        providerTokens,
      );
    });
  }

  public async delToken(
    providerId: ProviderId,
    identityId: IdentityId,
  ): Promise<void> {
    if (!this._started) {
      throw new identitiesErrors.ErrorIdentitiesManagerNotStarted();
    }
    return await this._transaction(async () => {
      const providerTokens = await this.getTokens(providerId);
      if (!(identityId in providerTokens)) {
        return;
      }
      delete providerTokens[identityId];
      if (!Object.keys(providerTokens).length) {
        await this.db.del(this.identitiesTokensDbDomain, providerId);
        return;
      }
      await this.db.put(
        this.identitiesTokensDbDomain,
        providerId,
        providerTokens,
      );
    });
  }
}

export default IdentitiesManager;
