import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind list';

export default class RemindListCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reminder list'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'List reminders of a user in this server ',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
        ],
        id: Formatter.Commands.ReminderListUser.COMMAND_ID,
        usage: '?<user>',
      },
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderListUser.CommandArgs) {
    return Formatter.Commands.ReminderListUser.createMessage(context, args);
  }
}
