import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'magik';

export class ImageGifMagikCommand extends BaseInteractionImageCommandOption {
  description = 'Magikfy an Image, Single-framed Images become Animated';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMagikAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMagikAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagikAnimated.createMessage(context, args);
  }
}
