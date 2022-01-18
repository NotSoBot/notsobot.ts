import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'reverse';

export class ImageGifReverseCommand extends BaseInteractionImageCommandOption {
  description = 'Reverse an Animated Image';
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageGifReverse.CommandArgs) {
    return Formatter.Commands.ImageGifReverse.createMessage(context, args);
  }
}
