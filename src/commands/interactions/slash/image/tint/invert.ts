import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'invert';

export class ImageInvertCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Invert an Image or Video\'s Color';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationInvert.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationInvert.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationInvert.createMessage(context, args);
  }
}
