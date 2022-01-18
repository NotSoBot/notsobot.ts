import { Command, CommandClient, Structures } from 'detritus-client';

import { editUser } from '../../../api';
import { CommandTypes } from '../../../constants';
import { Parameters, createUserString, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


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
        type: CommandTypes.OWNER,
        usage: '<user:id|mention|name>',
      },
      type: Parameters.memberOrUser({allowBots: false}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.user;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.user) {
      return editOrReply(context, '⚠ Unable to find that user.');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    await editUser(context, args.user.id, {blocked: false});
    return editOrReply(context, `Alright, unblocked ${createUserString(args.user.id, args.user)}.`);
  }
}
