import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'resize';

export default class ResizeCommand extends BaseImageCommand<Formatter.Commands.MediaIVToolsResize.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['enlarge', 'rescale'],
      args: [
        {name: 'convert'},
        {name: 'ratio', type: Boolean},
        {name: 'scale', default: 2, type: 'float'},
        {name: 'size'},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Resize an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -convert jpeg`,
          `${COMMAND_NAME} 👌🏿 -scale 2`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png -convert webp -size 2048`,
          `${COMMAND_NAME} https://apng.onevcat.com/assets/elephant.png -ratio -size 320x320`,
        ],
        id: Formatter.Commands.MediaIVToolsResize.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-convert <format>) (-ratio) (-scale <number>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsResize.CommandArgs) {
    return Formatter.Commands.MediaIVToolsResize.createMessage(context, args);
  }
}
