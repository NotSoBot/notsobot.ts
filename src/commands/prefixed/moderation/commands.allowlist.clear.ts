import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsAllowlistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands allowlist clear';

export default class CommandsAllowlistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds allowlist clear'],
      choices: Object.values(GuildCommandsAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildCommandsAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Clear out Channels/Roles/Users/Server-Wide allowlisted commands.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        id: Formatter.Commands.ModerationCommandsAllowlistClear.COMMAND_ID,
        usage: '?<GuildCommandsAllowlistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.MANAGE_GUILD],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlistClear.CommandArgs) {
    return Formatter.Commands.ModerationCommandsAllowlistClear.createMessage(context, args);
  }
}
