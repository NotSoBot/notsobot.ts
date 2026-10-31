import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, MAX_GUILD_WARNING_USERS, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'warn';

export default class WarnCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: Parameters.banPayloadDefault,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Warn multiple members with a reason, kept on their record here (it\'s sent to them too)',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} <@300505364032389122> spamming`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> posting in the wrong channel`,
        ],
        id: Formatter.Commands.ModerationWarn.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string>',
      },
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.banPayload({limit: MAX_GUILD_WARNING_USERS}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationWarn.CommandArgsBefore) {
    // over the limit still runs, so it says why instead of that nobody was found
    return !!args.payload && (!!args.payload.membersOrUsers.length || !!args.payload.overLimit);
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationWarn.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationWarn.CommandArgs) {
    return Formatter.Commands.ModerationWarn.createMessage(context, args);
  }
}
