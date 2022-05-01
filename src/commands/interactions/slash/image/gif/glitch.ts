import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glitch';

export class ImageGifGlitchCommand extends BaseInteractionImageCommandOption {
  description = 'Glitch an Image/Gif';
  metadata = {
    id: Formatter.Commands.ImageManipulationGlitchGif.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageManipulationGlitchGif.CommandArgs) {
    return Formatter.Commands.ImageManipulationGlitchGif.createMessage(context, args);
  }
}
