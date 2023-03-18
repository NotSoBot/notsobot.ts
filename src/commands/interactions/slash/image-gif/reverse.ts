import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'reverse';

export class ImageGifReverseCommand extends BaseInteractionImageCommandOption {
  description = 'Reverse an Animated Image/Audio/Video';
  metadata = {
    id: Formatter.Commands.MediaAIVToolsReverse.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsReverse.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsReverse.createMessage(context, args);
  }
}
