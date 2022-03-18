import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'crop';

export class ImageToolsCropCommand extends BaseInteractionImageCommandOption {
  description = 'Crop an Image';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageToolsCrop.CommandArgs) {
    return Formatter.Commands.ImageToolsCrop.createMessage(context, args);
  }
}
