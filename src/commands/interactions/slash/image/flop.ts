import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'flop';

export class ImageFlopCommand extends BaseInteractionImageCommandOption {
  description = 'Flop an Image (Horizontal Flip)';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlop.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlop.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlop.createMessage(context, args);
  }
}
