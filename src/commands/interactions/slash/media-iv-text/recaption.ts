import { Interaction } from 'detritus-client';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'recaption';

export class MediaIVRecaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Remove Caption Text then Add Caption Text to an Image or Video';
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRecaption.COMMAND_ID,
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
        {name: 'tolerance', description: `White Color Tolerance (0..255) (Default: 35)`, type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRecaption.createMessage(context, args);
  }
}
