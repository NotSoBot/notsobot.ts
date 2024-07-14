import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind list';

export default class RemindListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reminder list', 'reminders'],
      args: [
        {name: 'global', aliases: ['g'], type: Boolean},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'List of your Reminders in the Server or Globally',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -global`,
        ],
        id: Formatter.Commands.ReminderListMe.COMMAND_ID,
        usage: '(-global)',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderListMe.CommandArgs) {
    return Formatter.Commands.ReminderListMe.createMessage(context, args);
  }
}
