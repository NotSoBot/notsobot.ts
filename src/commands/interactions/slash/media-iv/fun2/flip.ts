import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'flip';

export class MediaIVFlipCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Flip an Image or Video (Vertical Flip)';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFlip.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFlip.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFlip.createMessage(context, args);
  }
}
