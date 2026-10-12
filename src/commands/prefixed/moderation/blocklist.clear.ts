import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildBlocklistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist clear';

export default class BlocklistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'Clear out Channels/Roles/Users/Server-Wide blocklist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationBlocklistClear.COMMAND_ID,
        usage: '?<GuildDisableCommandsType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistClear.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistClear.createMessage(context, args);
  }
}
