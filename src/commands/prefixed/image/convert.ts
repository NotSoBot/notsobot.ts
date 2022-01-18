import { Command, CommandClient } from 'detritus-client';

import { CommandTypes } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  size?: string,
  to: string,
  url?: null | string,
}

export const COMMAND_NAME = 'convert';

export default class ConvertCommand extends BaseImageCommand<Formatter.Commands.ImageToolsConvert.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'size'},
      ],
      metadata: {
        description: 'Convert an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot jpeg`,
          `${COMMAND_NAME} 👌🏿 png -size 2560`,
          `${COMMAND_NAME} https://cdn.notsobot.com/brands/notsobot.png webp`,
        ],
        type: CommandTypes.IMAGE,
        usage: '<emoji,user:id|mention,url> <...format> (-size <number|(width)x(height)>',
      },
      type: [
        {name: 'url', type: Parameters.imageUrlPositional},
        {name: 'to', consume: true},
      ],
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageToolsConvert.CommandArgs) {
    return Formatter.Commands.ImageToolsConvert.createMessage(context, args);
  }
}
