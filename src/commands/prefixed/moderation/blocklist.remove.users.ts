import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


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
        category: CommandCategories.MODERATION,
        description: 'Remove users from the blocklist.',
        examples: [
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@300505364032389122> <@61189081970774016>`,
        ],
        id: Formatter.Commands.ModerationBlocklistRemoveUsers.COMMAND_ID,
        usage: '...<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.membersOrUsers({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveUsers.CommandArgsBefore) {
    return !!args.users && !!args.users.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveUsers.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.users) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('info.users.not_found')}`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('errors.needs_query')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistRemoveUsers.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistRemoveUsers.createMessage(context, args);
  }
}
