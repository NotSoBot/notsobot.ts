import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'decoy';

export default class DecoyCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['decoy status'],
      disableDm: true,
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Show the server\'s decoy channel (one that removes anyone who posts in it, to catch spam accounts), its notice, and who it caught',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.ServerDecoy.COMMAND_ID,
        usage: '',
      },
      permissions: [Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.ServerDecoy.createStatusMessage(context);
  }
}
