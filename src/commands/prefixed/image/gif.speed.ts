import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  speed?: number,
  url?: null | string,
}

export interface CommandArgs {
  speed: number,
  url: string,
}

export const COMMAND_NAME = 'gif speed';

export default class GifSpeedCommand extends BaseImageCommand<Formatter.Commands.ImageGifSpeed.CommandArgs> {
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
        id: Formatter.Commands.ImageGifSpeed.COMMAND_ID,
        usage: '<emoji,user:id|mention,url> <...speed:milliseconds>',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false, video: false})},
        {name: 'speed', consume: true, type: Number},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageGifSpeed.CommandArgs) {
    return Formatter.Commands.ImageGifSpeed.createMessage(context, args);
  }
}
