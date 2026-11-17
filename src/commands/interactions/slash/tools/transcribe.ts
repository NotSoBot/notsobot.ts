import { Interaction } from 'detritus-client';

import { CommandRatelimits, TranscribeFileFormats, TranscribeFileFormatsToText } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'transcribe';

export class ToolsTranscribeCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Transcribe an Audio or Video File';
  descriptionLocalizations = I18n.localizations('commands.tools.transcribe.description');
  metadata = {
    id: Formatter.Commands.ToolsTranscribe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tools.transcribe.name');

  constructor() {
    super({
      ratelimits: CommandRatelimits.ML,
      options: [
        {
          name: 'file',
          description: 'Also attach it as a subtitles or lyrics file',
          ...I18n.optionLocalizations('commands.tools.transcribe.file'),
          choices: Parameters.Slash.oneOf({
            choices: TranscribeFileFormats,
            descriptions: TranscribeFileFormatsToText,
            doNotSort: true,
            localizationKey: 'choices.transcribe_file_formats',
          }),
        },
        {name: 'highlight', description: 'Highlight the word being said (.ass) or time each word (.lrc) (Default: False)', ...I18n.optionLocalizations('commands.tools.transcribe.highlight'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ToolsTranscribe.CommandArgs) {
    return Formatter.Commands.ToolsTranscribe.createMessage(context, args);
  }
}
