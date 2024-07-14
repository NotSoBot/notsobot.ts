import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { deleteVoice, fetchUserVoices } from '../../../api';
import { editOrReply } from '../../../utils';

import { findVoice } from './voice.list';


export const COMMAND_ID = 'voice.delete';

export interface CommandArgs {
  voice: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return editOrReply(context, 'You have no cloned voices');
  }

  const voice = findVoice(voices, args.voice);
  if (!voice) {
    return editOrReply(context, 'No cloned voices found matching that');
  }

  await deleteVoice(context, voice.id);
  return editOrReply(context, `Successfully deleted voice ${Markup.codestring(voice.name)}`);
}
