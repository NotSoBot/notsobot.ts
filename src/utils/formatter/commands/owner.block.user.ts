import { Command, Interaction } from 'detritus-client';

import UserStore from '../../../stores/users';

import { editUser } from '../../../api';
import { Parameters, createUserString, editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  payload: Parameters.BanPayloadMembersOnly | null,
}

export interface CommandArgs {
  payload: Parameters.BanPayloadMembersOnly,
}


export const COMMAND_ID = 'owner.block.user';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
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
