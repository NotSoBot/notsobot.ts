import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner block user';

export default class OwnerBlockUserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'for', aliases: ['duration', 'time', 't'], label: 'duration', type: Parameters.secondsWithOptions({float: false})},
      ],
      label: 'payload',
      metadata: {
        description: 'Block a user from the bot',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
          `${COMMAND_NAME} 300505364032389122 spamming -for 7d`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerBlockUser.COMMAND_ID,
        usage: '<user:id|mention|name> ?<reason:string> (-for <duration>)',
      },
      type: Parameters.banPayload({allowBots: false}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerBlockUser.CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  async onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerBlockUser.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    if (args.payload) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.no_members_found')}`});
    }
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('moderation.needs_members')}`});
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerBlockUser.CommandArgs) {
    return Formatter.Commands.OwnerBlockUser.createMessage(context, args);
  }
}
