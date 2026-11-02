import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'server fonts rename';

export default class ServerFontsRenameCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Rename one of the server\'s saved fonts',
        examples: [
          `${COMMAND_NAME} pacifico cursive`,
        ],
        id: Formatter.Commands.ServerFontsRename.COMMAND_ID,
        usage: '<name> <new name>',
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: [
        {name: 'name'},
        {name: 'newName', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ServerFontsRename.CommandArgs) {
    return !!args.name && !!args.newName;
  }

  async run(context: Command.Context, args: Formatter.Commands.ServerFontsRename.CommandArgs) {
    return Formatter.Commands.ServerFontsRename.createMessage(context, args);
  }
}
