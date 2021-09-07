import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandTypes, GuildAllowlistTypes } from '../../../constants';
import { Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { createAllowlistEmbed } from './allowlist';
import { removeAllowlist } from './allowlist.remove';


export interface CommandArgsBefore {
  roles: Array<Structures.Role> | null,
}

export interface CommandArgs {
  roles: Array<Structures.Role>,
}

export const COMMAND_NAME = 'allowlist remove roles';

export default class AllowlistRemoveRolesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'allowlist remove role',
        'allowlist delete role',
        'allowlist delete roles',
      ],
      default: null,
      disableDm: true,
      label: 'roles',
      metadata: {
        description: 'Remove roles from the allowlist.',
        examples: [
          `${COMMAND_NAME} everyone`,
          `${COMMAND_NAME} <@&668258873546637322> <@&178897437082124288>`,
        ],
        type: CommandTypes.MODERATION,
        usage: '...<role:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.roles,
    });
  }

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
    const { settings, title } = await removeAllowlist(context, payloads);
    return createAllowlistEmbed(context, settings.allowlist, {title});
  }
}
