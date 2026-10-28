import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ban';

export default class BanCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['hackban'],
      args: [
        {name: 'clean', default: 1 * 24 * 60 * 60, type: (value: string, context: Command.Context) => Parameters.seconds(value, false, context)},
        // the bot unbans them once it's over
        {name: 'for', aliases: ['duration', 'time', 't'], label: 'duration', type: Parameters.secondsWithOptions({float: false})},
      ],
      default: Parameters.banPayloadDefault,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Ban multiple users, add a reason, and clean their messages',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 -clean 1 day`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
          `${COMMAND_NAME} <@300505364032389122> spamming -for 7 days`,
        ],
        id: Formatter.Commands.ModerationBan.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string> (-clean <days>) (-for <duration>)',
      },
      permissionsClient: [Permissions.BAN_MEMBERS],
      permissions: [Permissions.BAN_MEMBERS],
      type: Parameters.banPayload({limit: Formatter.Commands.ModerationBan.MAX_USERS}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgsBefore) {
    // over the limit still runs, so it says why instead of that nobody was found
    return !!args.payload && (!!args.payload.membersOrUsers.length || !!args.payload.overLimit);
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_users_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgs) {
    return Formatter.Commands.ModerationBan.createMessage(context, args);
  }
}
