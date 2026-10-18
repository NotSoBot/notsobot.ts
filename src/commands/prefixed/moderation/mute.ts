import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'mute';

export default class MuteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['timeout'],
      args: [
        {
          name: 'for',
          aliases: ['duration', 'time', 't'],
          // the formatter reads `args.duration`, without this it ended up in `args.for` and every mute was the default hour
          label: 'duration',
          default: Formatter.Commands.ModerationMute.DEFAULT_DURATION,
          type: Parameters.secondsWithOptions({float: false}),
        },
      ],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Time out multiple members (default 1 hour, up to 28 days) with a reason',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} <@300505364032389122> spamming -for 10 minutes`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> -for 2d`,
        ],
        id: Formatter.Commands.ModerationMute.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string> (-for <duration>)',
      },
      permissionsClient: [Permissions.MODERATE_MEMBERS],
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.banPayload({membersOnly: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationMute.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationMute.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationMute.CommandArgs) {
    return Formatter.Commands.ModerationMute.createMessage(context, args);
  }
}
