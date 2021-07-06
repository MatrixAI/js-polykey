import commandCreateVault from './commandCreateVault';
import commandDeleteVault from './commandDeleteVault';
import commandListVaults from './commandListVaults';
import commandPullVault from './commandPullVault';
import commandRenameVault from './commandRenameVault';
import commandScanVault from './commandScanVault';
import commandVaultStats from './commandVaultStats';
import commandVaultShare from './commandVaultShare';
import commandVaultUnshare from './commandVaultUnshare';
import commandVaultPermissions from './commandVaultPermissions';
import * as binUtils from '../utils';

const commandVaults = binUtils.createCommand('vaults');
commandVaults.description('manipulate vaults');
commandVaults.addCommand(commandCreateVault);
commandVaults.addCommand(commandDeleteVault);
commandVaults.addCommand(commandListVaults);
commandVaults.addCommand(commandPullVault);
commandVaults.addCommand(commandRenameVault);
commandVaults.addCommand(commandScanVault);
commandVaults.addCommand(commandVaultStats);
commandVaults.addCommand(commandVaultShare);
commandVaults.addCommand(commandVaultUnshare);
commandVaults.addCommand(commandVaultPermissions);

export default commandVaults;
