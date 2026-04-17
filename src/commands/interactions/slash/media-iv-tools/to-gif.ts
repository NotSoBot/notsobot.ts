import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'to-gif';

export class MediaIVToolsToGifCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Convert an Image or Video to a gif, resizing and lowering fps as needed';
  metadata = {
    id: Formatter.Commands.MediaIVToolsToGif.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVToolsToGif.CommandArgs) {
    return Formatter.Commands.MediaIVToolsToGif.createMessage(context, args);
  }
}
