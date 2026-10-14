import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'kick';

export default class KickCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'clean', type: (value: string, context: Command.Context) => Parameters.seconds(value, false, context)},
      ],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Kick multiple members, add a reason, and clean their messages.',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 -clean 1 day`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
        ],
        id: Formatter.Commands.ModerationKick.COMMAND_ID,
        usage: '...?<user:id|mention> <reason (string)> (-clean <days>)',
      },
      // BAN_MEMBERS is only needed for `-clean`, checked in the formatter
      permissionsClient: [Permissions.KICK_MEMBERS],
      permissions: [Permissions.KICK_MEMBERS],
      type: Parameters.banPayload({membersOnly: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.needs_members')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationKick.CommandArgs) {
    return Formatter.Commands.ModerationKick.createMessage(context, args);
  }
}
