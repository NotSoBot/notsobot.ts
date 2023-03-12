import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'trim';

export class ImageToolsTrimCommand extends BaseInteractionImageCommandOption {
  description = 'Trim an Image\'s Excess Background';
  metadata = {
    id: Formatter.Commands.MediaIVToolsTrim.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsTrim.CommandArgs) {
    return Formatter.Commands.MediaIVToolsTrim.createMessage(context, args);
  }
}
