import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { BaseSlashCommand } from '../../basecommand';

import { SettingsOptOutGroupCommand } from './opt-out';
import { SettingsSetGroupCommand } from './set';


export default class SettingsGroupCommand extends BaseSlashCommand {
  description = 'User Settings';
  name = 'settings';

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
        //new SettingsOptOutGroupCommand(),
        new SettingsSetGroupCommand(),
      ],
    });
  }
}
