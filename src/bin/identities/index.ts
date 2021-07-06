import { createCommand } from '../utils';
import commandClaimKeynode from './commandClaimKeynode';
import commandAuthenticateProvider from './commandAuthenticateProvider';
import commandGetGestalts from './commandGetGestalts';
import commandListGestalts from './commandListGestalts';
import commandPermissionsGestalts from './commandPermissionsGestalts';
import commandTrustGestalts from './commandTrustGestalts';
import commandUntrustGestalts from './commandUntrustGestalts';
import commandAllowGestalts from './commandAllowGestalts';
import commandDisallowGestalts from './commandDisallowGestalts';
import commandSearchIdentities from './commandSearchIdentities';

const commandIdentities = createCommand('identities');
commandIdentities.description('identities commands');
commandIdentities.addCommand(commandClaimKeynode);
commandIdentities.addCommand(commandAuthenticateProvider);
commandIdentities.addCommand(commandGetGestalts);
commandIdentities.addCommand(commandListGestalts);
commandIdentities.addCommand(commandPermissionsGestalts);
commandIdentities.addCommand(commandTrustGestalts);
commandIdentities.addCommand(commandUntrustGestalts);
commandIdentities.addCommand(commandAllowGestalts);
commandIdentities.addCommand(commandDisallowGestalts);
commandIdentities.addCommand(commandSearchIdentities);

export default commandIdentities;
