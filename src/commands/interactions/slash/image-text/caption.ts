import { Interaction } from 'detritus-client';

import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'caption';

export class ImageCaptionCommand extends BaseInteractionImageCommandOption {
  description = 'Add Caption Text to an Image';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Caption Text', required: true},
        {name: 'font', description: 'Default: Montserrat Bold', choices: Parameters.Slash.IMAGE_MEME_FONTS},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, args);
  }
}
