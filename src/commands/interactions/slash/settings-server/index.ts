import { ApplicationIntegrationTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { SettingsServerSetGroupCommand } from './set';


export default class SettingsServerGroupCommand extends BaseSlashCommand {
  description = 'Server Settings';
  descriptionLocalizations = I18n.localizations('commands.settings_server.description');
  disableDm = true;
  name = 'settings-server';
  nameLocalizations = I18n.localizations('commands.settings_server.name');

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
