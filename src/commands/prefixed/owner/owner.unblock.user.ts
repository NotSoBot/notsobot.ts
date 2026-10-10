import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner unblock user';

export default class OwnerBlockUserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'user',
      metadata: {
        description: 'Unblock a user from the bot',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerUnblockUser.COMMAND_ID,
        usage: '<user:id|mention|name>',
      },
      type: Parameters.memberOrUser({allowBots: false}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: Formatter.Commands.OwnerUnblockUser.CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerUnblockUser.CommandArgsBefore) {
    if (!args.user) {
      return editOrReply(context, '⚠ Unable to find that user.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerUnblockUser.CommandArgs) {
    return Formatter.Commands.OwnerUnblockUser.createMessage(context, args);
  }
}
