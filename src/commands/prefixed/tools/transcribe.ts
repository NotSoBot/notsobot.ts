import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, CommandRatelimits, TranscribeFileFormats } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'transcribe';

export default class TranscribeCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tc'],
      args: [
        {name: 'file', aliases: ['f'], type: Parameters.oneOf({choices: TranscribeFileFormats}), metadata: {description: 'also attach it as subtitles (ass, srt) or lyrics (lrc)'}},
        {name: 'highlight', aliases: ['h'], type: Boolean, metadata: {description: 'the ass highlights the word being said, the lrc times each word'}},
        // no default, left out the file stays in the language spoken
        {name: 'translate', aliases: ['to', 't'], type: Parameters.locale, metadata: {description: 'translate the file to this language (srt when no -file)'}},
      ],
      metadata: {
        category: CommandCategories.AI,
        description: 'Transcribe an Audio or Video File',
        examples: [
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/voice.mp3 -file srt`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/music.mp3 -file lrc -highlight`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -file srt -translate spanish`,
        ],
        id: Formatter.Commands.ToolsTranscribe.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-file <ass|lrc|srt>) (-highlight) (-translate <language>)',
      },
      ratelimits: CommandRatelimits.ML,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsTranscribe.CommandArgs) {
    return Formatter.Commands.ToolsTranscribe.createMessage(context, args);
  }
}
