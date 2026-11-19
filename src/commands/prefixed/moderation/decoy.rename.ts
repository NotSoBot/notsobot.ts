import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy rename';

export interface CommandArgs {
  name?: string,
}

export default class DecoyRenameCommand extends BaseCommand {
  permissionsIgnoreClientOwner = false;

  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'name',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Give the decoy channel a new name, without one it gets a new one that fits the server\'s other channels',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} clips`,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID_RENAME,
        usage: '(<name>)',
      },
      permissions: [Permissions.MANAGE_GUILD, Permissions.BAN_MEMBERS],
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    return Formatter.Commands.ServerDecoy.createRenameMessage(context, args);
  }
}
