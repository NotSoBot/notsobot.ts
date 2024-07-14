import { ApplicationIntegrationTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { SettingsServerSetGroupCommand } from './set';


export default class SettingsServerGroupCommand extends BaseSlashCommand {
  description = 'Server Settings';
  disableDm = true;
  name = 'settings-server';

  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new SettingsServerSetGroupCommand(),
      ],
    });
  }
}
