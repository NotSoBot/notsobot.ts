import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'fonts remove';

export default class FontsRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['fonts delete', 'font remove'],

      metadata: {
        category: CommandCategories.PERSONAL,
        description: 'Remove one of your saved fonts',
        examples: [
          `${COMMAND_NAME} comic`,
        ],
        id: Formatter.Commands.FontsRemove.COMMAND_ID,
        usage: '<name>',
      },
      type: [
        {name: 'name'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Omit<Formatter.Commands.FontsRemove.CommandArgs, 'server'>) {
    return !!args.name;
  }

  async run(context: Command.Context, args: Omit<Formatter.Commands.FontsRemove.CommandArgs, 'server'>) {
    return Formatter.Commands.FontsRemove.createMessage(context, args);
  }
}
