import type { POJO } from '@/types';
import type {
  ProviderId,
  IdentityId,
  TokenData,
  IdentityData,
} from '@/identities/types';
import type {
  LinkId,
  LinkClaimIdentity,
  LinkInfoIdentity,
} from '@/links/types';
import type { NodeId } from '@/nodes/types';

import { Provider, errors as identitiesErrors } from '@/identities';

class TestProvider extends Provider {
  public readonly id = 'test-provider' as ProviderId;

  protected linkIdCounter: number = 0;
  protected users: Record<IdentityId, POJO>;
  protected links: Record<LinkId, string>;
  protected userLinks: Record<IdentityId, Array<LinkId>>;
  protected userTokens: Record<string, IdentityId>;

  public constructor() {
    super();
    this.users = {
      test_user: {
        email: 'test_user@test.com',
      },
      test_user2: {
        email: 'test_user2@test.com',
      },
    };
    this.links = {
      test_link: JSON.stringify({
        type: 'identity',
        node: 'nodeid' as NodeId,
        provider: this.id,
        identity: 'test_link' as IdentityId,
        timestamp: 1618650105,
        signature: 'somesignature',
      }),
    };
    this.userLinks = {
      test_user: ['test_link'],
    };
    this.userTokens = {
      abc123: 'test_user' as IdentityId,
    };
  }

  public async *authenticate(): AsyncGenerator<string | undefined, IdentityId> {
    const code = 'randomtestcode';
    yield code;
    // always gives back the abc123 token
    const tokenData = { accessToken: 'abc123' };
    const identityId = await this.getIdentityId(tokenData);
    await this.putToken(identityId, tokenData);
    return identityId;
  }

  public async refreshToken(): Promise<TokenData> {
    throw new identitiesErrors.ErrorProviderUnimplemented();
  }

  public async getAuthIdentityIds(): Promise<Array<IdentityId>> {
    const providerTokens = await this.getTokens();
    return Object.keys(providerTokens) as Array<IdentityId>;
  }

  public async getIdentityId(tokenData: TokenData): Promise<IdentityId> {
    tokenData = await this.checkToken(tokenData);
    return this.userTokens[tokenData.accessToken];
  }

  public async getIdentityData(
    authIdentityId: IdentityId,
    identityId: IdentityId,
  ): Promise<IdentityData | undefined> {
    let tokenData = await this.getToken(authIdentityId);
    if (!tokenData) {
      throw new identitiesErrors.ErrorProviderUnauthenticated(
        `${authIdentityId} has not been authenticated`,
      );
    }
    tokenData = await this.checkToken(tokenData, authIdentityId);
    const user = this.users[identityId];
    if (!user) {
      return;
    }
    return {
      providerId: this.id,
      identityId: identityId,
      email: user.email ?? undefined,
    };
  }

  public async *getConnectedIdentityDatas(
    authIdentityId: IdentityId,
  ): AsyncGenerator<IdentityData> {
    let tokenData = await this.getToken(authIdentityId);
    if (!tokenData) {
      throw new identitiesErrors.ErrorProviderUnauthenticated(
        `${authIdentityId} has not been authenticated`,
      );
    }
    tokenData = await this.checkToken(tokenData, authIdentityId);
    for (const [k, v] of Object.entries(this.users) as Array<
      [IdentityId, { email: string }]
    >) {
      if (k === authIdentityId) {
        continue;
      }
      yield {
        providerId: this.id,
        identityId: k,
        email: v.email ?? undefined,
      };
    }
    return;
  }

  public async publishLinkClaim(
    authIdentityId: IdentityId,
    linkClaim: LinkClaimIdentity,
  ): Promise<LinkInfoIdentity> {
    let tokenData = await this.getToken(authIdentityId);
    if (!tokenData) {
      throw new identitiesErrors.ErrorProviderUnauthenticated(
        `${authIdentityId} has not been authenticated`,
      );
    }
    tokenData = await this.checkToken(tokenData, authIdentityId);
    const linkId = this.linkIdCounter.toString();
    this.linkIdCounter++;
    this.links[linkId] = JSON.stringify(linkClaim);
    const links = this.userLinks[authIdentityId] ?? [];
    links.push(linkId);
    return {
      ...linkClaim,
      id: linkId,
    };
  }

  public async getLinkInfo(
    authIdentityId: IdentityId,
    linkId: LinkId,
  ): Promise<LinkInfoIdentity | undefined> {
    let tokenData = await this.getToken(authIdentityId);
    if (!tokenData) {
      throw new identitiesErrors.ErrorProviderUnauthenticated(
        `${authIdentityId} has not been authenticated`,
      );
    }
    tokenData = await this.checkToken(tokenData, authIdentityId);
    const linkClaimData = this.links[linkId];
    if (!linkClaimData) {
      return;
    }
    const linkClaim = this.parseLinkClaim(linkClaimData);
    if (!linkClaim) {
      return;
    }
    return {
      id: linkId,
      ...linkClaim,
    };
  }

  public async *getLinkInfos(
    authIdentityId: IdentityId,
    identityId: IdentityId,
  ): AsyncGenerator<LinkInfoIdentity> {
    let tokenData = await this.getToken(authIdentityId);
    if (!tokenData) {
      throw new identitiesErrors.ErrorProviderUnauthenticated(
        `${authIdentityId} has not been authenticated`,
      );
    }
    tokenData = await this.checkToken(tokenData, authIdentityId);
    const linkIds = this.userLinks[identityId] ?? [];
    for (const linkId of linkIds) {
      const linkInfo = await this.getLinkInfo(authIdentityId, linkId);
      if (linkInfo) {
        yield linkInfo;
      }
    }
  }
}

export default TestProvider;
