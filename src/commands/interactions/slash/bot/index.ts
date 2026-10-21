import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { BotInviteCommand } from './invite';
import { BotMemoryUsageCommand } from './memory-usage';
import { BotShardsCommand } from './shards';
import { BotUsageCommand } from './usage';


export default class BotGroupCommand extends BaseSlashCommand {
  description = 'NotSoBot\'s invite link, shards, memory and usage stats';
  descriptionLocalizations = I18n.localizations('commands.utils.description');
  name = 'bot';
  nameLocalizations = I18n.localizations('commands.utils.name');

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
        new BotInviteCommand(),
        new BotMemoryUsageCommand(),
        new BotShardsCommand(),
        new BotUsageCommand(),
      ],
    });
  }
}
