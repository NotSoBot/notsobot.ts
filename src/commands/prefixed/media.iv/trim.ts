import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'trim';

export default class TrimCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'margin', aliases: ['m'], type: Number},
        {name: 'threshold', aliases: ['t'], type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Trim an Image or Video\'s excess background',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -margin 0`,
        ],
        id: Formatter.Commands.MediaIVToolsTrim.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-margin <number>) (-threshold <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsTrim.CommandArgs) {
    return Formatter.Commands.MediaIVToolsTrim.createMessage(context, args);
  }
}
