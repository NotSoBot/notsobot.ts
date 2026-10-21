import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { SettingsAIMemoryGroupCommand } from './ai-memory';
import { SettingsPremiumServersGroupCommand } from './premium-servers';
import { SettingsSetGroupCommand } from './set';


export default class SettingsGroupCommand extends BaseSlashCommand {
  description = 'Your settings, AI memory and premium servers';
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
        new SettingsAIMemoryGroupCommand(),
        new SettingsPremiumServersGroupCommand(),
        new SettingsSetGroupCommand(),
      ],
    });
  }
}
