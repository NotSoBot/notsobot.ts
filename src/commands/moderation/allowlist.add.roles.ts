import { Command, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, EmbedColors, GuildAllowlistTypes } from '../../constants';
import { Parameters, DefaultParameters } from '../../utils';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';
import { createAllowlist } from './allowlist.add';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}


export default class AllowlistAddRolesCommand extends BaseCommand {
  aliases = ['allowlist add role'];
  name = 'allowlist add roles';

  default = null;
  disableDm = true;
  label = 'roles';
  metadata = {
    description: 'Add roles to the allowlist.',
    examples: [
      'allowlist add role everyone',
      'allowlist add roles <@&668258873546637322> <@&178897437082124288>',
    ],
    type: CommandTypes.MODERATION,
    usage: 'allowlist add roles ...<role mention|name>',
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
      type: GuildAllowlistTypes.ROLE,
    }> = roles.map((role) => ({item: role, type: GuildAllowlistTypes.ROLE}));
    const { settings, title } = await createAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
