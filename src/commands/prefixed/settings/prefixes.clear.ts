import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'prefixes clear';

export default class PrefixesClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['prefix clear'],
      disableDm: true,
      metadata: {
        category: CommandCategories.SETTINGS,
        description: 'Clear all custom prefixes from the guild. (Bot Mentions will always override this)',
        examples: [
          COMMAND_NAME,
        ],
        id: Formatter.Commands.PrefixesClear.COMMAND_ID,
        usage: '',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
    });
  }

  async run(context: Command.Context) {
    return Formatter.Commands.PrefixesClear.createMessage(context);
  }
}
