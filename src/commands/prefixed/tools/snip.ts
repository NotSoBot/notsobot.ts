import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'snip';

export default class SnipCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'audio', type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Snip an audio/video file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 10 50`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -50`,
          `${COMMAND_NAME} https://notsobot.com/some/video/file.mp4 -50 -audio`,
        ],
        id: Formatter.Commands.MediaAVToolsSnip.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <start> <end> (-audio)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({image: false})},
        {name: 'start', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
        {name: 'end', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVToolsSnip.CommandArgs) {
    return Formatter.Commands.MediaAVToolsSnip.createMessage(context, args);
  }
}
