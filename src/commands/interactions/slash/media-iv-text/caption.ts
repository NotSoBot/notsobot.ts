import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

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
      ],
    }, {skipFiles: Parameters.FONT_FILE_EXTENSIONS});
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationCaption.CommandArgs & {fontAttachment?: Structures.Attachment}) {
    const { fontAttachment, ...rest } = args;
    // an attached font wins over a link
    const fontUrl = (fontAttachment) ? fontAttachment.url || fontAttachment.proxyUrl || undefined : rest.fontUrl?.trim() || undefined;
    return Formatter.Commands.MediaIVManipulationCaption.createMessage(context, {...rest, fontUrl});
  }
}
