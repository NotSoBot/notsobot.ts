import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'memoryusage';

export default class MemoryUsageCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      metadata: {
        description: 'Show the bot\'s current memory usage',
        examples: [
          COMMAND_NAME,
        ],
        category: CommandCategories.UTILS,
        id: Formatter.Commands.UtilsMemoryUsage.COMMAND_ID,
        usage: '',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.UtilsMemoryUsage.createMessage(context);
  }
}
