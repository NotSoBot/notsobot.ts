import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'warnings';

export default class WarningsCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'user',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'List a member\'s warnings, or the server\'s newest ones',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} <@300505364032389122>`,
        ],
        id: Formatter.Commands.ModerationWarnings.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.memberOrUser(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationWarnings.CommandArgs) {
    // someone was given but couldn't be found, nothing given lists the server's
    return args.user !== null;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationWarnings.CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_users_found')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationWarnings.CommandArgs) {
    return Formatter.Commands.ModerationWarnings.createMessage(context, args);
  }
}
