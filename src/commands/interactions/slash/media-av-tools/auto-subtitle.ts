import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'auto-subtitle';

export class MediaAVToolsAutoSubtitleCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add subtitles of what\'s said in an Audio or Video, an Audio gets a black video';
  descriptionLocalizations = I18n.localizations('commands.media_av_tools.auto_subtitle.description');
  metadata = {
    id: Formatter.Commands.MediaAVToolsAutoSubtitle.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av_tools.auto_subtitle.name');

  constructor() {
    super({
      options: [
        {name: 'highlight', description: 'Highlight the word being said (Default: False)', ...I18n.optionLocalizations('commands.media_av_tools.auto_subtitle.highlight'), type: Boolean},
        {name: 'yellow', description: 'DVD yellow text instead of white (Default: False)', ...I18n.optionLocalizations('commands.media_av_tools.auto_subtitle.yellow'), type: Boolean},
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

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsAutoSubtitle.CommandArgs & {fontAttachment?: Structures.Attachment}) {
    const { fontAttachment, ...rest } = args;
    // an attached font wins over a link
    const fontUrl = (fontAttachment) ? fontAttachment.url || fontAttachment.proxyUrl || undefined : rest.fontUrl?.trim() || undefined;
    return Formatter.Commands.MediaAVToolsAutoSubtitle.createMessage(context, {...rest, fontUrl});
  }
}
