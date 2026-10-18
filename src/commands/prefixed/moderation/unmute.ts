import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'unmute';

export default class UnmuteCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['untimeout'],
      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Remove the timeout from multiple members',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> appealed`,
        ],
        id: Formatter.Commands.ModerationUnmute.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string>',
      },
      permissionsClient: [Permissions.MODERATE_MEMBERS],
      permissions: [Permissions.MODERATE_MEMBERS],
      type: Parameters.banPayload({membersOnly: true}),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationUnmute.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationUnmute.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationUnmute.CommandArgs) {
    return Formatter.Commands.ModerationUnmute.createMessage(context, args);
  }
}
