import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'snip';

export default class SnipCommand extends BaseMediaCommand {
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
        id: Formatter.Commands.MediaAIVToolsSnip.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <start,number> <end,number> (-audio)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional()},
        {name: 'start', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
        {name: 'end', default: 0, type: Parameters.secondsWithOptions({negatives: true})},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsSnip.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsSnip.createMessage(context, args);
  }
}
