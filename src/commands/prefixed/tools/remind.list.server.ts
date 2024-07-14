import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind list server';

export default class RemindListServerCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reminder list server', 'reminders server'],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'List of Reminders in the Server',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
        ],
        id: Formatter.Commands.ReminderListServer.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.memberOrUser(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    return Formatter.Commands.ReminderListServer.createMessage(context, args);
  }
}
