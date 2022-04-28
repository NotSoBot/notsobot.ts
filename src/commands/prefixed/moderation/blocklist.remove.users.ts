import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, EmbedColors, GuildBlocklistTypes } from '../../../constants';
import { Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';
import { removeBlocklist } from './blocklist.remove';


export interface CommandArgsBefore {
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}

export const COMMAND_NAME = 'blocklist remove users';

export default class BlocklistRemoveUsersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'blocklist remove user',
        'blocklist delete user',
        'blocklist delete users',
      ],
      disableDm: true,
      label: 'users',
      metadata: {
        description: 'Remove users from the blocklist.',
        examples: [
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@300505364032389122> <@61189081970774016>`,
        ],
        category: CommandCategories.MODERATION,
        usage: '...<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.membersOrUsers({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.users && !!args.users.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.users) {
      return context.editOrReply('⚠ Unable to find any users.');
    }
    return context.editOrReply('⚠ Provide some kind of query.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { users } = args;
    const payloads: Array<{
      item: Structures.User,
      type: GuildBlocklistTypes.USER,
    }> = users.map((user) => ({item: user, type: GuildBlocklistTypes.USER}));
    const { settings, title } = await removeBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
