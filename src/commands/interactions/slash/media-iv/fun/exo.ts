import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'exo';

export class MediaIVExoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Exo-alienify an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationExo.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationExo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationExo.createMessage(context, args);
  }
}
