import { Command, Interaction } from 'detritus-client';

import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const users: Array<string> = [];
  for (let memberOrUser of args.payload.membersOrUsers) {
    await UserStore.getOrFetch(context, memberOrUser.id);
    await editUser(context, memberOrUser.id, {
      blocked: true,
      blockedReason: args.payload.text,
    });
    users.push(createUserString(memberOrUser.id, memberOrUser));
  }

  let content: string = translate('owner_block_user.successfully_blocked', {users: users.join(', ')});
  if (args.payload.text) {
    content = translate('owner_block_user.reason', {content: content, text: args.payload.text});
  }
  return editOrReply(context, content);
}
