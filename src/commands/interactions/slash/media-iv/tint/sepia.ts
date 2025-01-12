import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'sepia';

export class MediaIVSepiaCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Sepia Tint to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationSepia.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationSepia.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationSepia.createMessage(context, args);
  }
}
