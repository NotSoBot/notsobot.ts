import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteVoice, fetchUserVoices } from '../../../api';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'voice.delete';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return editOrReply(context, 'You have no voices cloned');
  }
  await deleteVoice(context, voices[0].id);
  return editOrReply(context, `Successfully deleted voice ${Markup.codestring(voices[0].name)}`);
}
