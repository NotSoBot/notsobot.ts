import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'ping';

export default class PingCommand extends BaseSlashCommand {
  description = 'Check NotSoBot\'s response time';
  descriptionLocalizations = I18n.localizations('commands.ping.description');
  metadata = {
    id: Formatter.Commands.UtilsPing.COMMAND_ID,
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
    return Formatter.Commands.UtilsPing.createMessage(context);
  }
}
