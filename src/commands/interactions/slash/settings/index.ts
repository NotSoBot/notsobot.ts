import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { SettingsSetGroupCommand } from './set';


export default class SettingsGroupCommand extends BaseSlashCommand {
  description = 'User Settings';
  descriptionLocalizations = I18n.localizations('commands.settings.description');
  name = 'settings';
  nameLocalizations = I18n.localizations('commands.settings.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  constructor() {
    super({
      options: [
        new SettingsSetGroupCommand(),
      ],
    });
  }
}
