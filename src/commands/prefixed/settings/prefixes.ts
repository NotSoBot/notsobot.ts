import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'prefixes';

export default class PrefixesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix'],
      disableDm: true,
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Show all current prefixes in the server.',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.PrefixesList.COMMAND_ID,
        usage: `${COMMAND_NAME}`,
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -1,
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.PrefixesList.createMessage(context);
  }
}
