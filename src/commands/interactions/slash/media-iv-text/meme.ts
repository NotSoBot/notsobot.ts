import { Interaction } from 'detritus-client';

import { ImageMemeFonts, ImageMemeFontsToText } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const DEFAULT_FONT_TEXT = ImageMemeFontsToText[ImageMemeFonts.IMPACT];

export const COMMAND_NAME = 'meme';

export class MediaIVMemeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add Meme Text to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMeme.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Separate with |', required: true},
        {name: 'font', description: `Default: ${DEFAULT_FONT_TEXT}`, choices: Parameters.Slash.IMAGE_MEME_FONTS},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMeme.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMeme.createMessage(context, args);
  }
}
