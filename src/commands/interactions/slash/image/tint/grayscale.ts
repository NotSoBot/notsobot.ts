import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grayscale';

export class ImageGrayscaleCommand extends BaseInteractionImageCommandOption {
  description = 'Grayscale an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGrayscale.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGrayscale.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrayscale.createMessage(context, args);
  }
}
