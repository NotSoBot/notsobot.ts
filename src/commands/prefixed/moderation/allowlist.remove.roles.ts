import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


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
        category: CommandCategories.MODERATION,
        id: Formatter.Commands.ModerationAllowlistRemoveRoles.COMMAND_ID,
        usage: '...<role:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.roles,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveRoles.CommandArgsBefore) {
    return !!args.roles && !!args.roles.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveRoles.CommandArgsBefore) {
    if (args.roles) {
      return context.editOrReply(`${StatusEmojis.WARNING} Unable to find any roles.`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} Provide some kind of query.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlistRemoveRoles.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistRemoveRoles.createMessage(context, args);
  }
}
