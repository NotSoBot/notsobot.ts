import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'pixelate';

export default class PixelateCommand extends BaseImageCommand<Formatter.Commands.ImagePixelate.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['pixel'],
      args: [
        {name: 'width', type: Number},
      ],
      metadata: {
        description: 'Pixelate an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -width 2`,
        ],
        id: Formatter.Commands.ImagePixelate.COMMAND_ID,
        category: CommandCategories.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-width <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImagePixelate.CommandArgs) {
    return Formatter.Commands.ImagePixelate.createMessage(context, args);
  }
}
