import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildBlocklistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist';

export default class BlocklistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all channels/roles/users part of the server\'s blocklist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationBlocklist.COMMAND_ID,
        usage: '?<GuildBlocklistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -2,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklist.CommandArgs) {
    return Formatter.Commands.ModerationBlocklist.createMessage(context, args);
  }
}
