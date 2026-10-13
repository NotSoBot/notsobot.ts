import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'memory-usage';

export class UtilsMemoryUsageCommand extends BaseInteractionCommandOption {
  description = 'Show the bot\'s current memory usage';
  descriptionLocalizations = I18n.localizations('commands.utils.memory_usage.description');
  metadata = {
    id: Formatter.Commands.UtilsMemoryUsage.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.memory_usage.name');

  constructor() {
    super({
    });
  }

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsMemoryUsage.createMessage(context);
  }
}
