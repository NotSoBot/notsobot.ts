import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';
import { createBlocklist } from './blocklist.add';


export interface CommandArgsBefore {
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}

export const COMMAND_NAME = 'blocklist add users';

export default class BlocklistAddUsersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['blocklist add user'],
      disableDm: true,
      label: 'users',
      metadata: {
        description: 'Add users to the blocklist.',
        examples: [
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@300505364032389122> <@61189081970774016>`,
        ],
        type: CommandTypes.MODERATION,
        usage: '...<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.membersOrUsers({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    const { users } = args;
    return !!users && !!users.length && !users.some((user) => {
      return user.id === context.userId;
    });
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.users) {
      if (args.users.length) {
        return context.editOrReply('⚠ Don\'t block yourself dummy');
      }
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
    const { settings, title } = await createBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
