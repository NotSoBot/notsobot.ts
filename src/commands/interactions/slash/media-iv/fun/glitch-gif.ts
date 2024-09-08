import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glitch-gif';

export class MediaIVGlitchGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Glitch an Image or Video, Single-framed Images become Animated';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlitchAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlitchAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlitchAnimated.createMessage(context, args);
  }
}
