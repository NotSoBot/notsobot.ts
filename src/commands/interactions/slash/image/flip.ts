import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'flip';

export class ImageFlipCommand extends BaseInteractionImageCommandOption {
  description = 'Flip an Image (Vertical Flip)';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageFlip.CommandArgs) {
    return Formatter.Commands.ImageFlip.createMessage(context, args);
  }
}
