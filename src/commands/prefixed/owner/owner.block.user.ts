import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand } from '../basecommand';


export const COMMAND_NAME = 'owner block user';

export default class OwnerBlockUserCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      label: 'payload',
      metadata: {
        description: 'Block a user from the bot',
        examples: [
          `${COMMAND_NAME} 300505364032389122`,
        ],
        category: CommandCategories.OWNER,
        id: Formatter.Commands.OwnerBlockUser.COMMAND_ID,
        usage: '<user:id|mention|name>',
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

  onCancelRun(context: Command.Context, args: Formatter.Commands.OwnerBlockUser.CommandArgsBefore) {
    if (args.payload) {
      return context.editOrReply('⚠ Couldn\'t find any members. (Use Mentions or User IDs)');
    }
    return context.editOrReply('⚠ Provide some members');
  }

  async run(context: Command.Context, args: Formatter.Commands.OwnerBlockUser.CommandArgs) {
    return Formatter.Commands.OwnerBlockUser.createMessage(context, args);
  }
}
