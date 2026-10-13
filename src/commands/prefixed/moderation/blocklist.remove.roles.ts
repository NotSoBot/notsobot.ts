import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist remove roles';

export default class BlocklistRemoveRolesCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: [
        'blocklist remove role',
        'blocklist delete role',
        'blocklist delete roles',
      ],
      default: null,
      disableDm: true,
      label: 'roles',
      metadata: {
        description: 'Remove roles from the blocklist.',
        examples: [
          `${COMMAND_NAME} everyone`,
          `${COMMAND_NAME} <@&668258873546637322> <@&178897437082124288>`,
        ],
        category: CommandCategories.SERVER,
        id: Formatter.Commands.ModerationBlocklistRemoveRoles.COMMAND_ID,
        usage: '...<role:id|mention|name>',
      },
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.roles,
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveRoles.CommandArgsBefore) {
    return !!args.roles && !!args.roles.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveRoles.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.roles) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_roles_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.needs_query')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveRoles.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemoveRoles.createMessage(context, args);
  }
}
