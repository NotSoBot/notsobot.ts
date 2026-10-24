import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'warnings clear';

export default class WarningsClearCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: Parameters.banPayloadDefault,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Remove every warning of multiple users (members that left too)',
        examples: [
          `${COMMAND_NAME} <@300505364032389122>`,
          `${COMMAND_NAME} 300505364032389122 439205512425504771`,
        ],
        id: Formatter.Commands.ModerationWarningsClear.COMMAND_ID,
        usage: '...?<user:id|mention>',
      },
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.banPayload({limit: MAX_GUILD_WARNING_USERS}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationWarningsClear.CommandArgsBefore) {
    return !!args.payload && (!!args.payload.membersOrUsers.length || !!args.payload.overLimit);
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationWarningsClear.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_users_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationWarningsClear.CommandArgs) {
    return Formatter.Commands.ModerationWarningsClear.createMessage(context, args);
  }
}
