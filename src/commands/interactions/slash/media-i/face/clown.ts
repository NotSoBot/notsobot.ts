import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clown';

export class MediaIClownCommand extends BaseInteractionImageCommandOption {
  description = 'Clownify an Image\'s face';
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceClown.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceClown.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceClown.createMessage(context, args);
  }
}
