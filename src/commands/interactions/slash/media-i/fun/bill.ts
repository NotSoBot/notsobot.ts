import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'bill';

export class MediaIBillCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a 100 dollar bill';
  metadata = {
	id: Formatter.Commands.MediaIManipulationBill.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationBill.CommandArgs) {
	return Formatter.Commands.MediaIManipulationBill.createMessage(context, args);
  }
}
