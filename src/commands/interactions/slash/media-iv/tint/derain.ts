import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'derain';

export class MediaIVDerainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply the opposite of a Rainbow tint to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDerain.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDerain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDerain.createMessage(context, args);
  }
}
