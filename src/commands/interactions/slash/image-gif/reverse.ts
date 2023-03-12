import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse';

export class ImageGifReverseCommand extends BaseInteractionImageCommandOption {
  description = 'Reverse an Animated Image';
  metadata = {
    id: Formatter.Commands.MediaIVToolsFramesReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsFramesReverse.CommandArgs) {
    return Formatter.Commands.MediaIVToolsFramesReverse.createMessage(context, args);
  }
}
