import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grayscale';

export class ImageGrayscaleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Grayscale an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGrayscale.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGrayscale.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrayscale.createMessage(context, args);
  }
}
