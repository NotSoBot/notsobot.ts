import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'speed';

export default class SpeedCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Edit an animated image/audio/video\'s Speed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        id: Formatter.Commands.MediaAIVToolsSpeed.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...speed:milliseconds>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'speed', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsSpeed.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsSpeed.createMessage(context, args);
  }
}
