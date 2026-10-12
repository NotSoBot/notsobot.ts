import { Interaction } from 'detritus-client';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'recaption';

export class MediaIVRecaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Remove Caption Text then Add Caption Text to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.recaption.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationRecaption.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.recaption.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Caption Text',
          ...I18n.optionLocalizations('commands.media_iv_text.recaption.text'),
          value: Parameters.parsedMentionsText,
          required: true,
        },
        {
          name: 'font',
          description: 'Font Choice',
          ...I18n.optionLocalizations('commands.media_iv_text.recaption.font'),
          choices: Parameters.Slash.oneOf({
            choices: MediaMemeFonts,
            defaultChoice: Formatter.Commands.MediaIVManipulationCaption.DEFAULT_FONT,
            descriptions: MediaMemeFontsToText,
          }),
        },
        {name: 'tolerance', description: `White Color Tolerance (0..255) (Default: 35)`, ...I18n.optionLocalizations('commands.media_iv_text.recaption.tolerance'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationRecaption.createMessage(context, args);
  }
}
