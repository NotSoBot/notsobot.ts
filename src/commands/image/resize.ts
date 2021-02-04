import { Command, CommandClient } from 'detritus-client';

import { imageToolsResize } from '../../api';
import { CommandTypes } from '../../constants';
import { imageReply } from '../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  convert?: string,
  scale: number,
  size?: string,
  url?: null | string,
}

export interface CommandArgs {
  convert?: string,
  scale: number,
  size?: string,
  url: string,
}

export const COMMAND_NAME = 'resize';

export default class ResizeCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['enlarge', 'rescale'],
      args: [
        {name: 'convert'},
        {name: 'scale', default: 2, type: 'float'},
        {name: 'size'},
      ],
      metadata: {
        description: 'Resize an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -convert jpeg`,
          `${COMMAND_NAME} 👌🏿 -scale 2`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png -convert webp -size 2048`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url> (-convert <format>) (-scale <number>) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageToolsResize(context, args);
    return imageReply(context, response);
  }
}
