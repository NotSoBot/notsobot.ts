import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'burn';

export class MediaIBurnCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a burning photo';
  metadata = {
	id: Formatter.Commands.MediaIManipulationBurn.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationBurn.CommandArgs) {
	return Formatter.Commands.MediaIManipulationBurn.createMessage(context, args);
  }
}
