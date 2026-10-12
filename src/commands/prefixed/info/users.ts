import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'users';

export default class UsersCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['members'],
      args: [
        {name: 'bots', type: Boolean},
        {name: 'hasnick', type: Boolean},
        {name: 'role', type: Parameters.role},
      ],
      default: DefaultParameters.members,
      label: 'users',
      metadata: {
        description: 'Get information about multiple members/users',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} -bots`,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} cake -role admin`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoUsers.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.membersOrUsersSearch(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    return !!args.users.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.role === null) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('logger.unknown_role')}`);
    }
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('info.users.not_found')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgs) {
    return Formatter.Commands.InfoUsers.createMessage(context, args);
  }
}
