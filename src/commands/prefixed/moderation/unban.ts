import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'unban';

export default class UnbanCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: null,
      disableDm: true,
      label: 'payload',
      metadata: {
        category: CommandCategories.MODERATION,
        description: 'Unban multiple users and add a reason',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 <@439205512425504771>`,
          `${COMMAND_NAME} <@300505364032389122> <@439205512425504771> some reason here`,
        ],
        id: Formatter.Commands.ModerationUnban.COMMAND_ID,
        usage: '...?<user:id|mention> <reason:string>',
      },
      permissionsClient: [Permissions.BAN_MEMBERS, Permissions.EMBED_LINKS],
      permissions: [Permissions.BAN_MEMBERS],
      type: Parameters.banPayload(),
    });
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.ModerationUnban.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.ModerationUnban.CommandArgsBefore) {
    if (args.payload) {
      return context.editOrReply(`${StatusEmojis.WARNING} Couldn't find any users. (Use Mentions or User IDs)`);
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.ModerationUnban.CommandArgs) {
    return Formatter.Commands.ModerationUnban.createMessage(context, args);
  }
}
