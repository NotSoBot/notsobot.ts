import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'fonts';

export default class FontsListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['fonts list', 'font list'],

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'List your saved fonts',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.FontsList.COMMAND_ID,
        usage: '',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.FontsList.CommandArgs) {
    return Formatter.Commands.FontsList.createMessage(context, args);
  }
}
