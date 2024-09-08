import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'blurple';

export class MediaIVBlurpleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Blurple-fy an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationBlurple.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationBlurple.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBlurple.createMessage(context, args);
  }
}
