import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'google reverse';

export default class GoogleReverseCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['g reverse', 'images', 'imgs'],
      metadata: {
        category: CommandCategories.SEARCH,
        description: 'Reverse Search an image using Google',
        examples: [
          `${COMMAND_NAME}`,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.SearchGoogleReverse.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.SearchGoogleReverse.CommandArgs) {
    return Formatter.Commands.SearchGoogleReverse.createMessage(context, args);
  }
}
