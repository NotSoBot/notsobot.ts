import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class FontsListCommand extends BaseInteractionCommandOption {
  description = 'List your saved fonts';
  metadata = {
    id: Formatter.Commands.FontsList.COMMAND_ID,
  };
  name = 'list';

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.FontsList.CommandArgs) {
    return Formatter.Commands.FontsList.createMessage(context, args);
  }
}
