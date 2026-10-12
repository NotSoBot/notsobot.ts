import { Interaction } from 'detritus-client';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'meme';

export class MediaIVMemeCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add Meme Text to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.meme.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationMeme.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Separate with |',
          ...I18n.optionLocalizations('commands.media_iv_text.meme.text'),
          value: Parameters.parsedMentionsText,
          required: true,
        },
        {
          name: 'font',
          description: 'Font Choice',
          ...I18n.optionLocalizations('commands.media_iv_text.meme.font'),
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
