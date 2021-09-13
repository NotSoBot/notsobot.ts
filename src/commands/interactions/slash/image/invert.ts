import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'invert';

export class ImageInvertCommand extends BaseInteractionImageCommandOption {
  description = 'Invert an Image\'s Color';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageInvert.CommandArgs) {
    return Formatter.Commands.ImageInvert.createMessage(context, args);
  }
}
