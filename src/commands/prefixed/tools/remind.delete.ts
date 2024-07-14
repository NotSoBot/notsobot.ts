import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind delete';

export default class RemindDeleteCommand extends BaseCommand {
  constructor(client: CommandClient) {
	super(client, {
	  name: COMMAND_NAME,

	  aliases: ['reminder delete'],
	  label: 'position',
	  metadata: {
		category: CommandCategories.TOOLS,
		description: 'Delete a reminder',
		examples: [
		  `${COMMAND_NAME} 1`,
		  `${COMMAND_NAME} 5`,
		],
		id: Formatter.Commands.ReminderDeleteMe.COMMAND_ID,
		usage: '<position,number>',
	  },
	  priority: -1,
	  type: Number,
	});
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderDeleteMe.CommandArgs) {
	return Formatter.Commands.ReminderDeleteMe.createMessage(context, args);
  }
}
