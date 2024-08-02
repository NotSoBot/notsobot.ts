import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain';

export class ImageRainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rainbow tintify an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRain.createMessage(context, args);
  }
}
