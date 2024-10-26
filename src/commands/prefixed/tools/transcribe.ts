import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'transcribe';

export default class TranscribeCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['tc'],
      args: [
        {name: 'noembed', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Transcribe an audio or video file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3`,
        ],
        id: Formatter.Commands.ToolsTranscribe.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ToolsTranscribe.CommandArgs) {
    return Formatter.Commands.ToolsTranscribe.createMessage(context, args);
  }
}
