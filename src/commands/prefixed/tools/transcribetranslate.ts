import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { DefaultParameters, Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'transcribetranslate';

export default class TranscribeTranslateCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tctr', 'tctranslate', 'transcribetr', 'trtranscribe', 'trtc', 'translatetranscribe', 'translatetc'],
      args: [
        {name: 'to', default: DefaultParameters.locale, type: Parameters.locale},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Transcribe an audio or video file then translate it',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.ToolsTranscribeTranslate.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-to <language>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsTranscribeTranslate.CommandArgs) {
    return Formatter.Commands.ToolsTranscribeTranslate.createMessage(context, args);
  }
}
