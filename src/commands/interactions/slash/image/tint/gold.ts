import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gold';

export class ImageGoldCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Gold tintify an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGold.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGold.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGold.createMessage(context, args);
  }
}
