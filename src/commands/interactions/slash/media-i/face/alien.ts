import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'alien';

export class MediaIAlienCommand extends BaseInteractionImageCommandOption {
  description = 'Alienify an Image\'s face';
  metadata = {
	id: Formatter.Commands.MediaIManipulationFaceAlien.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationFaceAlien.CommandArgs) {
	return Formatter.Commands.MediaIManipulationFaceAlien.createMessage(context, args);
  }
}
