import { Command, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildBlocklistTypes } from '../../constants';
import { Parameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createBlocklistEmbed } from './blocklist';
import { createBlocklist } from './blocklist.add';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}


export default class BlocklistAddRolesCommand extends BaseCommand {
  aliases = ['blocklist add role'];
  name = 'blocklist add roles';

  disableDm = true;
  label = 'roles';
  metadata = {
    description: 'Add roles to the blocklist.',
    examples: [
      'blocklist add role everyone',
      'blocklist add roles <@&668258873546637322> <@&178897437082124288>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'blocklist add roles ...<role mention|name>',
  };
  permissionsClient = [Permissions.EMBED_LINKS];
  permissions = [Permissions.MANAGE_GUILD];
  type = Parameters.roles;

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.roles && !!args.roles.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.roles) {
      return context.editOrReply('⚠ Unable to find any roles.');
    }
    return context.editOrReply('⚠ Provide some kind of query.');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { roles } = args;
    const payloads: Array<{
      item: Structures.Role,
      type: GuildBlocklistTypes.ROLE,
    }> = roles.map((role) => ({item: role, type: GuildBlocklistTypes.ROLE}));
    const { settings, title } = await createBlocklist(context, payloads);
    return createBlocklistEmbed(context, settings.blocklist, {title});
  }
}
