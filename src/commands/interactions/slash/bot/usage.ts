import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'usage';

export class BotUsageCommand extends BaseInteractionCommandOption {
  description = 'Show the bot\'s current usage (and Discord object counts)';
  descriptionLocalizations = I18n.localizations('commands.utils.usage.description');
  metadata = {
    id: Formatter.Commands.UtilsUsage.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.usage.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsUsage.createMessage(context);
  }
}
