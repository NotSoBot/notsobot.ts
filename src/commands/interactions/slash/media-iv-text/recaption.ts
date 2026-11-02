import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

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
          // a bundled font or one of their (or the server's) saved fonts, autocompleted since saved ones are per user
          value: Parameters.mediaFont,
          onAutoComplete: Parameters.AutoComplete.mediaFont,
        },
        {
          name: 'font-attachment',
          description: 'A font file of your own to attach (.ttf, .otf, .woff, .woff2)',
          ...I18n.optionLocalizations('commands.media_iv_text.font_attachment'),
          label: 'fontAttachment',
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
        {
          // the api checks the link (and the font) itself
          name: 'font-url',
          description: 'A link to a font file of your own (.ttf, .otf, .woff, .woff2)',
          ...I18n.optionLocalizations('commands.media_iv_text.font_url'),
          label: 'fontUrl',
          maxLength: 2048,
        },
        {name: 'tolerance', description: `White Color Tolerance (0..255) (Default: 35)`, ...I18n.optionLocalizations('commands.media_iv_text.recaption.tolerance'), type: Number},
      ],
    }, {skipFiles: Parameters.FONT_FILE_EXTENSIONS});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationRecaption.CommandArgs & {fontAttachment?: Structures.Attachment}) {
    const { fontAttachment, ...rest } = args;
    // an attached font wins over a link
    const fontUrl = (fontAttachment) ? fontAttachment.url || fontAttachment.proxyUrl || undefined : rest.fontUrl?.trim() || undefined;
    return Formatter.Commands.MediaIVManipulationRecaption.createMessage(context, {...rest, fontUrl});
  }
}
