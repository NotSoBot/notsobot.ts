import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'list';

export class PrefixesListCommand extends BaseInteractionCommandOption {
  description = 'List the Server\'s Prefixes';
  metadata = {
    id: Formatter.Commands.PrefixesList.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.PrefixesList.createMessage(context);
  }
}
