import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'allowlist add users';

export default class AllowlistAddUsersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['allowlist add user'],
      disableDm: true,
      label: 'users',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Add users to the allowlist.',
        examples: [
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} <@300505364032389122> <@61189081970774016>`,
        ],
        id: Formatter.Commands.ModerationAllowlistAddUsers.COMMAND_ID,
        usage: '...<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      permissions: [Permissions.ADMINISTRATOR],
      type: Parameters.membersOrUsers({allowBots: false}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistAddUsers.CommandArgsBefore) {
    const { users } = args;
    return !!users && !!users.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationAllowlistAddUsers.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.users) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('info.users.not_found')}`);
    }
    return context.editOrReply(`${StatusEmojis.WARNING} ${translate('errors.needs_query')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationAllowlistAddUsers.CommandArgs) {
    return Formatter.Commands.ModerationAllowlistAddUsers.createMessage(context, args);
  }
}
