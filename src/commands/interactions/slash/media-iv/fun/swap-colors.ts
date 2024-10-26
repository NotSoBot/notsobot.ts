import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'swap-colors';

export class MediaIVSwapColorsCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Shuffle each pixel\'s RGBA Channels of an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSwapColors.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSwapColors.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSwapColors.createMessage(context, args);
  }
}
