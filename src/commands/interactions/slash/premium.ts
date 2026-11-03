import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'premium';

export default class PremiumCommand extends BaseSlashCommand {
  description = 'See what NotSoPremium unlocks and where to get it';
  descriptionLocalizations = I18n.localizations('commands.premium.description');
  metadata = {
    id: Formatter.Commands.UtilsPremium.COMMAND_ID,
  };
  name = COMMAND_NAME;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsPremium.createMessage(context);
  }
}
