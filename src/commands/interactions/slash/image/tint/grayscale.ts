import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grayscale';

export class ImageGrayscaleCommand extends BaseInteractionImageCommandOption {
  description = 'Grayscale an Image';
  metadata = {
    id: Formatter.Commands.ImageGrayscale.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageGrayscale.CommandArgs) {
    return Formatter.Commands.ImageGrayscale.createMessage(context, args);
  }
}
