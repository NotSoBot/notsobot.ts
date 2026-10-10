import { Command, Interaction, Structures } from 'detritus-client';

import { editUser } from '../../../api';
import { createUserString, editOrReply } from '../../../utils';


export interface CommandArgsBefore {
  user: Structures.Member | Structures.User | null,
}

export interface CommandArgs {
  user: Structures.Member | Structures.User,
}


export const COMMAND_ID = 'owner.unblock.user';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  await editUser(context, args.user.id, {blocked: false});
  return editOrReply(context, `Alright, unblocked ${createUserString(args.user.id, args.user)}.`);
}
