import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, GuildAllowlistTypes } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'allowlist clear';

export default class AllowlistClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      choices: Object.values(GuildAllowlistTypes),
      default: null,
      disableDm: true,
      help: `Must be one of (${Object.values(GuildAllowlistTypes).join(', ')})`,
      label: 'only',
      metadata: {
        description: 'Clear out Channels/Roles/Users/Server-Wide allowlist.',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} channel`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ModerationAllowlistClear.COMMAND_ID,
        usage: '?<GuildDisableCommandsType>',
      },
      permissions: [Permissions.ADMINISTRATOR],
      priority: -1,
      type: (value: string) => value.toLowerCase(),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlistClear.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistClear.createMessage(context, args);
  }
}
