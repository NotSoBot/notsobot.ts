import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain';

export class ImageRainCommand extends BaseInteractionImageCommandOption {
  description = 'Rainbow tintify an Image';
  metadata = {
    id: Formatter.Commands.ImageRain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageRain.CommandArgs) {
    return Formatter.Commands.ImageRain.createMessage(context, args);
  }
}
