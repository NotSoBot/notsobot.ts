import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

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
          `${COMMAND_NAME} cake -role admin`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoUsers.COMMAND_ID,
        usage: '?<user:id|mention|name> (-bots) (-hasnick) (-role <role:id|mention|name>)',
      },
      type: Parameters.membersOrUsersSearch(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgsBefore) {
    if (args.role === null) {
      return false;
    }
    // the search parameter returns null when nobody matched
    return !!args.users && !!args.users.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.role === null) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('logger.unknown_role')}`});
    }
    if (!args.users) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('info.users.not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoUsers.CommandArgs) {
    return Formatter.Commands.InfoUsers.createMessage(context, args);
  }
}
