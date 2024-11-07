import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paint-gif';

export class MediaIVPaintGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a gradually increasing Oil Paint effect to a Single-framed Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationPaintAnimated.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationPaintAnimated.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationPaintAnimated.createMessage(context, args);
  }
}
