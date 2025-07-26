import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'latte';

export class MediaILatteCommand extends BaseInteractionImageCommandOption {
  description = 'Draw an Image on a Latte';
  metadata = {
    id: Formatter.Commands.MediaIManipulationLatte.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIManipulationLatte.CommandArgs) {
    return Formatter.Commands.MediaIManipulationLatte.createMessage(context, args);
  }
}
