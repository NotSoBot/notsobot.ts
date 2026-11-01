import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'recaption';

export class MediaIVRecaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Replace an Image or Video\'s caption with new text';
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
        {
          name: 'font-file',
          description: 'A font file of your own (.ttf, .otf, .woff, .woff2)',
          ...I18n.optionLocalizations('commands.media_iv_text.font_file'),
          label: 'fontFile',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {name: 'tolerance', description: `White Color Tolerance (0..255) (Default: 35)`, ...I18n.optionLocalizations('commands.media_iv_text.recaption.tolerance'), type: Number},
      ],
    }, {skipFiles: Parameters.FONT_FILE_EXTENSIONS});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs & {fontFile?: Structures.Attachment}) {
    const { fontFile, ...rest } = args;
    const fontUrl = (fontFile) ? fontFile.url || fontFile.proxyUrl || undefined : undefined;
    return Formatter.Commands.MediaIVManipulationRecaption.createMessage(context, {...rest, fontUrl});
  }
}
