import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'rain-gold';

export class MediaIVRainGoldCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Rainbowish Gold tintify an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRainGold.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRainGold.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRainGold.createMessage(context, args);
  }
}
