import type { LinkInfo } from '../links';
import type { NodeInfo } from '../nodes';
import type { IdentityInfo } from '../identities';

type GestaltKey = string;

type GestaltMatrix = {
  [key: string]: {
    [key: string]: LinkInfo;
  };
};

type GestaltNodes = { [key: string]: NodeInfo };

type GestaltIdentities = { [key: string]: IdentityInfo };

type Gestalt = {
  graph: GestaltMatrix;
  nodes: GestaltNodes;
  identities: GestaltIdentities;
};

export { GestaltKey, GestaltMatrix, GestaltNodes, GestaltIdentities, Gestalt };