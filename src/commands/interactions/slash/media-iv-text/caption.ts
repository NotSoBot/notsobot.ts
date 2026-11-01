import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MediaMemeFonts, MediaMemeFontsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'caption';

export class MediaIVCaptionCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Add Caption Text to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_text.caption.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationCaption.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_text.caption.name');

  constructor() {
    super({
      options: [
        {
          name: 'text',
          description: 'Caption text, separate top and bottom with |',
          ...I18n.optionLocalizations('commands.media_iv_text.caption.text'),
          value: Parameters.parsedMentionsText,
          required: true,
        },
        {
          name: 'font',
          description: 'Font Choice',
          ...I18n.optionLocalizations('commands.media_iv_text.caption.font'),
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
      ],
    }, {skipFiles: Parameters.FONT_FILE_EXTENSIONS});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs & {fontFile?: Structures.Attachment}) {
    const { fontFile, ...rest } = args;
    const fontUrl = (fontFile) ? fontFile.url || fontFile.proxyUrl || undefined : undefined;
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, {...rest, fontUrl});
  }
}
