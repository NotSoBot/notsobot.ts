import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'kek';

export class MediaIVKekCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Exo-alienify and Swirl an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationKek.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationKek.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationKek.createMessage(context, args);
  }
}
