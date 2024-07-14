import { Command, CommandClient } from 'detritus-client';

import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind delete server';

export default class RemindDeleteServerCommand extends BaseCommand {
  constructor(client: CommandClient) {
	  super(client, {
	    name: COMMAND_NAME,
  
	    aliases: ['reminder delete server'],
	    label: 'position',
	    metadata: {
		    category: CommandCategories.TOOLS,
		    description: 'Delete a User\'s Reminder from the Server',
		    examples: [
		      `${COMMAND_NAME} 1`,
		      `${COMMAND_NAME} 5`,
		    ],
		    id: Formatter.Commands.ReminderDeleteServer.COMMAND_ID,
		    usage: '<user:id|mention|name> ?<position,number>',
	    },
	    priority: -1,
	    type: [
        {name: 'user', type: Parameters.memberOrUser()},
        {name: 'position', type: Number, consume: true},
      ],
	  });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ReminderDeleteServer.CommandArgs) {
    return args.user !== null;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ReminderDeleteServer.CommandArgs) {
    if (args.user === null) {
      return editOrReply(context, `${BooleanEmojis.WARNING} Unable to find that user.`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderDeleteServer.CommandArgs) {
    return Formatter.Commands.ReminderDeleteServer.createMessage(context, args);
  }
}
