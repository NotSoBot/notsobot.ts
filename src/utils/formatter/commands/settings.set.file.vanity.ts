import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editUser } from '../../../api';
import { editOrReply } from '../..';


export const COMMAND_ID = 'settings.set.file.vanity';

export interface CommandArgs {
  vanity?: string | null,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const user = await editUser(context, context.userId, {
    vanity: args.vanity,
  });

  let text: string;
  if (user.file) {
    if (user.file.vanity) {
      text = `Ok, set your file upload vanity to ${Markup.codestring(user.file.vanity)}`;
    } else {
      text = 'Ok, cleared out your file upload vanity';
    }
  } else {
    text = 'Unknown Error, Sorry';
  }

  return editOrReply(context, {
    content: text,
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
