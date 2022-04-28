import { Command, CommandClient } from 'detritus-client';

import { RestResponsesRaw } from '../../../api/types';
import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind';

export default class RemindCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reminder', 'remind create', 'reminder create'],
      label: 'result',
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Create a reminder',
        examples: [
          `${COMMAND_NAME} me to take out the dishes at 4pm`,
          `${COMMAND_NAME} unmute someone in 2 days`,
          `${COMMAND_NAME} do the laundry tomorrow`,
        ],
        id: Formatter.Commands.ReminderCreate.COMMAND_ID,
        usage: '<natural-timestamp-and-text>',
      },
      priority: -2,
      type: Parameters.nlpTimestamp,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderCreate.CommandArgs) {
    return Formatter.Commands.ReminderCreate.createMessage(context, args);
  }
}
