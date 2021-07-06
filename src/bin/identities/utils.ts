import { ProviderId, IdentityId } from '../../identities/types';

function identityString(
  providerId: ProviderId,
  identityId: IdentityId,
): string {
  return `${providerId}:${identityId}`;
}

function isIdentitystring(input: string): boolean {
  const re = /^[a-zA-Z]+\.com:[a-zA-Z]+$/;
  return re.test(input);
}

function parseIdentityString(identityString: string): {
  providerId: ProviderId;
  identityId: IdentityId;
} {
  const split = identityString.split(':');
  const providerId = split[0] as ProviderId;
  const identityId = split[1] as IdentityId;
  return { providerId, identityId };
}

function parseId(id: string) {
  let providerId: string | null = null;
  let identityId: string | null = null;
  let nodeId: string | null = null;
  if (isIdentitystring(id)) {
    const parsed = parseIdentityString(id);
    providerId = parsed.providerId;
    identityId = parsed.identityId;
  } else {
    nodeId = id;
  }
  return { providerId, identityId, nodeId };
}

export { identityString, isIdentitystring, parseIdentityString, parseId };
