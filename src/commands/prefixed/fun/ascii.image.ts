import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'ascii image';

export default class AsciiImageCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'mobile', aliases: ['m'], type: Boolean},
        {name: 'size', aliases: ['s'], type: Number},
      ],
      aliases: ['ascii i'],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Convert an Image to ASCII Text',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -mobile`,
          `${COMMAND_NAME} notsobot -size 8`,
        ],
        id: Formatter.Commands.FunAsciiFromImage.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-mobile) (-size <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.FunAsciiFromImage.CommandArgs) {
    return Formatter.Commands.FunAsciiFromImage.createMessage(context, args);
  }
}
