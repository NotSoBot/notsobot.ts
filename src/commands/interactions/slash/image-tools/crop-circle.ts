import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-circle';

export class ImageToolsCropCircleCommand extends BaseInteractionImageCommandOption {
  description = 'Crop out a circle from an Image';
  metadata = {
    id: Formatter.Commands.ImageToolsCropCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageToolsCropCircle.CommandArgs) {
    return Formatter.Commands.ImageToolsCropCircle.createMessage(context, args);
  }
}
