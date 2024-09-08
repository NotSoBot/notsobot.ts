import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop-circle';

export class MediaIVToolsCropCircleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Crop out a circle from an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCropCircle.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCropCircle.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCropCircle.createMessage(context, args);
  }
}
