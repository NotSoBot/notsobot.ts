import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, editOrReply } from '../../../utils';

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

  async onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerSeenOn.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.payload.user) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.user_not_found')}`);
    } else if (args.payload.user.bot) {
      return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.no_bots')}`);
    }
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('owner.no_shared_guilds')}`);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerSeenOn.CommandArgs) {
    return Formatter.Commands.OwnerSeenOn.createMessage(context, args);
  }
}
