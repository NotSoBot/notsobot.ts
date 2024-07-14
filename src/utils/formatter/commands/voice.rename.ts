import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchUserVoices, voiceCloneEdit } from '../../../api';
import { editOrReply } from '../../../utils';

import { findVoice } from './voice.list';


export const COMMAND_ID = 'voice.rename';

export interface CommandArgs {
  name: string,
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

  const voice = await voiceCloneEdit(context, result.id, {name: args.name});
  return editOrReply(context, `Successfully renamed voice ${Markup.codestring(result.name)} to ${Markup.codestring(voice.name)}.`);
}
