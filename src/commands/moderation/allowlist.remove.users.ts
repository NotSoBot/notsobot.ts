import { Command, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';
import { removeAllowlist } from './allowlist.remove';


export interface CommandArgsBefore {
  users: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs {
  users: Array<Structures.Member | Structures.User>,
}


export default class AllowlistRemoveUsersCommand extends BaseCommand {
  aliases = [
    'allowlist remove user',
    'allowlist delete user',
    'allowlist delete users',
  ];
  name = 'allowlist remove users';

  disableDm = true;
  label = 'users';
  metadata = {
    description: 'Remove users from the allowlist.',
    examples: [
      'allowlist remove user notsobot',
      'allowlist remove users <@300505364032389122> <@61189081970774016>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'allowlist remove users ...<user mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.ADMINISTRATOR];
  type = Parameters.membersOrUsers({allowBots: false});

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
      type: GuildAllowlistTypes.USER,
    }> = users.map((user) => ({item: user, type: GuildAllowlistTypes.USER}));
    const { settings, title } = await removeAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
