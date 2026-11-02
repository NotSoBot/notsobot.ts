import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'server fonts remove';

export default class ServerFontsRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,
      aliases: ['server fonts delete'],

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Remove one of the server\'s saved fonts',
        examples: [
          `${COMMAND_NAME} pacifico`,
        ],
        id: Formatter.Commands.ServerFontsRemove.COMMAND_ID,
        usage: '<name>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: [
        {name: 'name'},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ServerFontsRemove.CommandArgs) {
    return !!args.name;
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerFontsRemove.CommandArgs) {
    return Formatter.Commands.ServerFontsRemove.createMessage(context, args);
  }
}
