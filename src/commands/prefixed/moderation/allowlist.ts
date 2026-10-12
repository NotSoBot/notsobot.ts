import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildAllowlistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'allowlist';

export default class AllowlistCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'List all channels/roles/users part of the server\'s allowlist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channels`,
        ],
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationAllowlist.COMMAND_ID,
        usage: '?<GuildAllowlistType>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      priority: -2,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlist.CommandArgs) {
    return Formatter.Commands.ModerationAllowlist.createMessage(context, args);
  }
}
