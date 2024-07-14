import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'help';

export default class HelpCommand extends BaseSlashCommand {
  description = 'Help';
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

  run(context: Interaction.InteractionContext) {
    return editOrReply(
      context,
      '<https://notsobot.com/commands> (Join our support server <https://notsobot.com/support/invite>)',
    );
  }
}
