import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildCommandsAllowlistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'commands allowlist';

export default class CommandsAllowlistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['cmds allowlist'],
      choices: Object.values(GuildCommandsAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildCommandsAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'List all allowlisted commands (and their associated type)',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        id: Formatter.Commands.ModerationCommandsAllowlist.COMMAND_ID,
        usage: '?<GuildCommandsAllowlistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationCommandsAllowlist.CommandArgs) {
    return Formatter.Commands.ModerationCommandsAllowlist.createMessage(context, args);
  }
}
