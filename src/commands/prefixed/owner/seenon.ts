import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'seenon';

export default class SeenOnCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      default: (context: Command.Context) => context.userId,
      label: 'payload',
      metadata: {
        description: 'Get guilds a user shares with NotSoBot',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} cake`,
          `${COMMAND_NAME} cake#1`,
          `${COMMAND_NAME} <@439205512425504771>`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerSeenOn.COMMAND_ID,
        usage: '?<user:id|mention|name>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Formatter.Commands.OwnerSeenOn.getSharedGuilds,
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerSeenOn.CommandArgsBefore) {
    return !!args.payload.user && !args.payload.user.bot && !!args.payload.results.length;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerSeenOn.CommandArgsBefore) {
    if (!args.payload.user) {
      return editOrReply(context, `${StatusEmojis.WARNING} Unable to find that user.`);
    } else if (args.payload.user.bot) {
      return editOrReply(context, `${StatusEmojis.WARNING} Bots cannot be used with this command.`);
    }
    return editOrReply(context, `${StatusEmojis.WARNING} User shares no guilds.`);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerSeenOn.CommandArgs) {
    return Formatter.Commands.OwnerSeenOn.createMessage(context, args);
  }
}
