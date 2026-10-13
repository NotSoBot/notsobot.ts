import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'ban';

export default class BanCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['hackban'],
      args: [
        {name: 'clean', default: 1 * 24 * 60 * 60, type: (value: string, context: Command.Context) => Parameters.seconds(value, false, context)},
      ],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Ban multiple users, add a reason, and clean their messages.',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 -clean 1 day`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
        ],
        id: Formatter.Commands.ModerationBan.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string> (-clean <days>)',
      },
      permissionsClient: [Permissions.BAN_MEMBERS],
      permissions: [Permissions.BAN_MEMBERS],
      type: Parameters.banPayload(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return context.editOrReply(`${StatusEmojis.WARNING} ${translate('moderation.no_users_found')}`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationBan.CommandArgs) {
    return Formatter.Commands.ModerationBan.createMessage(context, args);
  }
}
