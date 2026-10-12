import { Command, Interaction, Structures } from 'detritus-client';

import { editUser } from '../../../api';
import { getTranslator } from '../../i18n';
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
  const { language, translate, translateMaybe } = await getTranslator(context);
  await editUser(context, args.user.id, {blocked: false});
  return editOrReply(context, translate('owner_unblock_user.alright_unblocked', {user: createUserString(args.user.id, args.user)}));
}
