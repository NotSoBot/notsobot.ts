import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'glitch';

export class MediaIVGlitchCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Glitch an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGlitch.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGlitch.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGlitch.createMessage(context, args);
  }
}
