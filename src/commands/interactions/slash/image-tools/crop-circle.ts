import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-circle';

export class ImageToolsCropCircleCommand extends BaseInteractionImageCommandOption {
  description = 'Crop out a circle from an Image';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCropCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCropCircle.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCropCircle.createMessage(context, args);
  }
}
