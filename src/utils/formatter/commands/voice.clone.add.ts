import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchUserVoices, voiceCloneAdd } from '../../../api';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'voice.clone.add';

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

  const voice = await voiceCloneAdd(context, voices[0].id, args);
  return editOrReply(context, `Successfully added another audio file to voice ${Markup.codestring(voice.name)}.`);
}
