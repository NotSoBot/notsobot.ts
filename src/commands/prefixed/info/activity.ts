import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'activity';

export default class ActivityCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['presence'],
      default: DefaultParameters.authorOrReplyAuthor(),
      label: 'user',
      metadata: {
        description: 'Get a user\'s current activity, defaults to self',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.INFO,
        id: Formatter.Commands.InfoActivity.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    return !!args.user;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.InfoActivity.CommandArgs) {
    return Formatter.Commands.InfoActivity.createMessage(context, args);
  }
}
