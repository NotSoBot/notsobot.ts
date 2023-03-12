import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain';

export class ImageRainCommand extends BaseInteractionImageCommandOption {
  description = 'Rainbow tintify an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRain.createMessage(context, args);
  }
}
