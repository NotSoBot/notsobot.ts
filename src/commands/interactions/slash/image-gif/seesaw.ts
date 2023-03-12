import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'seesaw';

export class ImageGifSeeSawCommand extends BaseInteractionImageCommandOption {
  description = 'SeeSaw an Animated Image, add a reversed copy of itself at the end of it';
  metadata = {
    id: Formatter.Commands.MediaIVToolsFramesSeeSaw.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsFramesSeeSaw.CommandArgs) {
    return Formatter.Commands.MediaIVToolsFramesSeeSaw.createMessage(context, args);
  }
}
