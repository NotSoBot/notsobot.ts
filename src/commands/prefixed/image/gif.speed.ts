import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'gif speed';

export default class GifSpeedCommand extends BaseImageCommand<Formatter.Commands.MediaIVToolsFramesSpeed.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Edit a gif\'s speed',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://i.imgur.com/WwiO7Bx.jpg`,
        ],
        id: Formatter.Commands.MediaIVToolsFramesSpeed.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...speed:milliseconds>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'speed', consume: true, type: 'float'},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsFramesSpeed.CommandArgs) {
    return Formatter.Commands.MediaIVToolsFramesSpeed.createMessage(context, args);
  }
}
