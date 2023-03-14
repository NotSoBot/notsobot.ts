import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseAudioOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'snip';

export default class SnipCommand extends BaseAudioOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Snip an audio/video file',
        examples: [
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 10 50`,
          `${COMMAND_NAME} https://notsobot.com/some/audio/file.mp3 -50`,
        ],
        id: Formatter.Commands.MediaAVToolsSnip.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> <start> <end>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({image: false})},
        {name: 'start', default: 0, type: Parameters.seconds_with_negative},
        {name: 'end', default: 0, type: Parameters.seconds_with_negative},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAVToolsSnip.CommandArgs) {
    return Formatter.Commands.MediaAVToolsSnip.createMessage(context, args);
  }
}
