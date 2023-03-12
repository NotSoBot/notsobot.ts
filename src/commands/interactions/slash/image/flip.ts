import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'flip';

export class ImageFlipCommand extends BaseInteractionImageCommandOption {
  description = 'Flip an Image (Vertical Flip)';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlip.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlip.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlip.createMessage(context, args);
  }
}
