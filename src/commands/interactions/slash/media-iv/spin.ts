import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin';

export class MediaIVSpinCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Create a Spinning Disk from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSpin.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSpin.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSpin.createMessage(context, args);
  }
}
