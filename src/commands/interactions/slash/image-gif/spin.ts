import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin';

export class ImageSpinCommand extends BaseInteractionImageCommandOption {
  description = 'Create a Spinning Disk from an Image/Gif';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpin.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin.createMessage(context, args);
  }
}
