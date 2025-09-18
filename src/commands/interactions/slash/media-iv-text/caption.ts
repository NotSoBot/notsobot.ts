import { Interaction } from 'detritus-client';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'caption';

export class MediaIVCaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add Caption Text to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Caption Text', required: true},
        {
          name: 'font',
          description: 'Font Choice',
          choices: Parameters.Slash.oneOf({
            choices: MediaMemeFonts,
            defaultChoice: Formatter.Commands.MediaIVManipulationCaption.DEFAULT_FONT,
            descriptions: MediaMemeFontsToText,
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, args);
  }
}
