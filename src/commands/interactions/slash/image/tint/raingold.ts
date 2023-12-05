import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain-gold';

export class ImageRainGoldCommand extends BaseInteractionImageCommandOption {
  description = 'Rainbowish Gold tintify an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRainGold.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRainGold.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRainGold.createMessage(context, args);
  }
}
