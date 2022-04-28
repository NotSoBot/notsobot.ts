import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'blurple';

export class ImageBlurpleCommand extends BaseInteractionImageCommandOption {
  description = 'Blurple-fy an Image';
  metadata = {
    id: Formatter.Commands.ImageBlurple.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageBlurple.CommandArgs) {
    return Formatter.Commands.ImageBlurple.createMessage(context, args);
  }
}
