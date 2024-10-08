import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'magik-gif';

export class MediaIVMagikGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Magikfy an Image or Video, Single-framed Images become Animated';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMagikAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMagikAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMagikAnimated.createMessage(context, args);
  }
}
