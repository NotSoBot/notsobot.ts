import { Interaction } from 'detritus-client';

import { Formatter } from '../../../../../utils';

import { BaseInteractionImageCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'magik';

export class ImageGifMagikCommand extends BaseInteractionImageCommandOption {
  description = 'Moving Magikfy an Image/Gif';
  metadata = {
    id: Formatter.Commands.ImageMagikGif.COMMAND_ID,
  };
  name = COMMAND_NAME;

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageMagikGif.CommandArgs) {
    return Formatter.Commands.ImageMagikGif.createMessage(context, args);
  }
}
