import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'crop';

export class ImageToolsCropCommand extends BaseInteractionImageCommandOption {
  description = 'Crop an Image automatically';
  metadata = {
    id: Formatter.Commands.MediaIVToolsCrop.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsCrop.CommandArgs) {
    return Formatter.Commands.MediaIVToolsCrop.createMessage(context, args);
  }
}
