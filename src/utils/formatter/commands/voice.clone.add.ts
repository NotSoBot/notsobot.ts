import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchUserVoices, voiceCloneAdd } from '../../../api';
import { editOrReply } from '../../../utils';

import { findVoice } from './voice.list';


export const COMMAND_ID = 'voice.clone.add';

export interface CommandArgs {
  url: string,
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

  const result = findVoice(voices, args.voice);
  if (!result) {
    return editOrReply(context, 'No cloned voices found matching that');
  }

  const voice = await voiceCloneAdd(context, result.id, args);
  return editOrReply(context, `Successfully added another audio file to voice ${Markup.codestring(voice.name)}.`);
}
