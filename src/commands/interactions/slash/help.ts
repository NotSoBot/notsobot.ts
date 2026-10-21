import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { I18n, displayReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseSlashCommand {
  description = 'Get help with NotSoBot\'s commands';
  descriptionLocalizations = I18n.localizations('commands.help.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.help.name');

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  run(context: Interaction.InteractionContext) {
    return displayReply(context, {description: '<https://notsobot.com/commands> (Join our support server <https://notsobot.com/support/invite>)'});
  }
}
