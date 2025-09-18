import { Interaction } from 'detritus-client';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


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
        {
          name: 'font',
          description: 'Font Choice',
          choices: Parameters.Slash.oneOf({
            choices: MediaMemeFonts,
            defaultChoice: Formatter.Commands.MediaIVManipulationMeme.DEFAULT_FONT,
            descriptions: MediaMemeFontsToText,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationMeme.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMeme.createMessage(context, args);
  }
}
