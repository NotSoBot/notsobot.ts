import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n } from '../../../../utils';

import { BaseSlashCommand } from '../../basecommand';

import { UtilsInviteCommand } from './invite';
import { UtilsMemoryUsageCommand } from './memory-usage';
import { UtilsShardsCommand } from './shards';
import { UtilsUsageCommand } from './usage';


export default class UtilsGroupCommand extends BaseSlashCommand {
  description = 'Utility Commands';
  descriptionLocalizations = I18n.localizations('commands.utils.description');
  name = 'utils';
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
        new UtilsInviteCommand(),
        new UtilsMemoryUsageCommand(),
        new UtilsShardsCommand(),
        new UtilsUsageCommand(),
      ],
    });
  }
}
