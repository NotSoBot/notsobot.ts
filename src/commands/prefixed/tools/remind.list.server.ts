import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'remind list server';

export default class RemindListServerCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['reminder list server', 'reminders server'],
      metadata: {
        category: CommandCategories.UTILITY,
        pipeable: true,
        description: 'List the reminders in this server',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
        ],
        id: Formatter.Commands.ReminderListServer.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      // the formatter reads `args.user`, without a label it was stored under the command name and the filter was ignored
      label: 'user',
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    // a user was given but couldn't be found (otherwise it would silently list everyone's reminders)
    return args.user !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ReminderListServer.CommandArgs) {
    return Formatter.Commands.ReminderListServer.createMessage(context, args);
  }
}
