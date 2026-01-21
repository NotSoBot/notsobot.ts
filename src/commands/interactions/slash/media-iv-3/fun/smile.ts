import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'smile';

export class MediaIVSmileCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make all the characters in an Image or Video (first frame) smile so big.';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSmile.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSmile.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSmile.createMessage(context, args);
  }
}
