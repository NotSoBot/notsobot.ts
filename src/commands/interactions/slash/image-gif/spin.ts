import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'spin';

export class ImageSpinCommand extends BaseInteractionImageCommandOption {
  description = 'Create a Spinning Disk from an Image/Gif';
  metadata = {
    id: Formatter.Commands.ImageSpin.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageSpin.CommandArgs) {
    return Formatter.Commands.ImageSpin.createMessage(context, args);
  }
}
