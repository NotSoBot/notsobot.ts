import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'trim';

export default class TrimCommand extends BaseImageCommand<Formatter.Commands.ImageToolsTrim.CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Trim an image\'s excess background',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.ImageToolsTrim.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ImageToolsTrim.CommandArgs) {
    return Formatter.Commands.ImageToolsTrim.createMessage(context, args);
  }
}
