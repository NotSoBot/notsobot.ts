import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsBlocklistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands blocklist clear';

export default class CommandsBlocklistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds blocklist clear'],
      choices: Object.values(GuildCommandsBlocklistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildCommandsBlocklistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Clear out Channels/Roles/Users/Server-Wide blocked commands.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        id: Formatter.Commands.ModerationCommandsBlocklistClear.COMMAND_ID,
        usage: '?<GuildCommandsBlocklistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsBlocklistClear.CommandArgs) {
    return Formatter.Commands.ModerationCommandsBlocklistClear.createMessage(context, args);
  }
}
