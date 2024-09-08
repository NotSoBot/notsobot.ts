import { Command, CommandClient, Structures } from 'detritus-client';

import UserStore from '../../../stores/users';

import { editUser } from '../../../api';
import { CommandCategories } from '../../../constants';
import { Parameters, createUserString, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly,
}


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
        usage: '<user:id|mention|name>',
      },
      type: Parameters.banPayload({allowBots: false}),
    });
  }

  onBefore(context: Command.Context) {
    return context.user.isClientOwner;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.payload && !!args.payload.membersOrUsers.length;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.payload) {
      return context.editOrReply('⚠ Couldn\'t find any members. (Use Mentions or User IDs)');
    }
    return context.editOrReply('⚠ Provide some members');
  }

  async run(context: Command.Context, args: CommandArgs) {
    const users: Array<string> = [];
    for (let memberOrUser of args.payload.membersOrUsers) {
      await UserStore.getOrFetch(context, memberOrUser.id);
      await editUser(context, memberOrUser.id, {
        blocked: true,
        blockedReason: args.payload.text,
      });
      users.push(createUserString(memberOrUser.id, memberOrUser));
    }

    let content: string = `Successfully blocked ${users.join(', ')}.`;
    if (args.payload.text) {
      content = `${content} (Reason: \`${args.payload.text}\`)`;
    }
    return editOrReply(context, content);
  }
}
