import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'gold';

export class ImageGoldCommand extends BaseInteractionImageCommandOption {
  description = 'Gold tintify an Image';
  metadata = {
    id: Formatter.Commands.ImageGold.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageGold.CommandArgs) {
    return Formatter.Commands.ImageGold.createMessage(context, args);
  }
}
