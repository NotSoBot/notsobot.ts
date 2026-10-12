import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'blocklist add users';

export default class BlocklistAddUsersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['blocklist add user'],
      disableDm: true,
      label: 'users',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Add users to the blocklist.',
        examples: [
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@300505364032389122> <@61189081970774016>`,
        ],
        id: Formatter.Commands.ModerationBlocklistAddUsers.COMMAND_ID,
        usage: '...<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.membersOrUsers({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddUsers.CommandArgsBefore) {
    const { users } = args;
    return !!users && !!users.length && !users.some((user) => {
      return user.id === context.userId;
    });
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddUsers.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.users) {
      if (args.users.length) {
        return context.editOrReply(`${StatusEmojis.WARNING} ${translate('commands.context.blocklist_add.self')}`);
      }
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('info.users.not_found')}`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('errors.needs_query')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBlocklistAddUsers.CommandArgs) {
    return Formatter.Commands.ModerationBlocklistAddUsers.createMessage(context, args);
  }
}
