import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'meme';

export class ImageMemeCommand extends BaseInteractionImageCommandOption {
  description = 'Add Meme Text to an Image';
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Separate with |', required: true},
        {name: 'font', description: 'Default: Impact', choices: Parameters.Slash.IMAGE_MEME_FONTS},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ImageMeme.CommandArgs) {
    return Formatter.Commands.ImageMeme.createMessage(context, args);
  }
}
