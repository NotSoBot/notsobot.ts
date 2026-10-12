import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { fetchUserVoices, voiceCloneEdit } from '../../../api';
import { getTranslator } from '../../i18n';
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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return editOrReply(context, translate('voice_rename.you_have_no_cloned_voices'));
  }

  const result = findVoice(voices, args.voice);
  if (!result) {
    return editOrReply(context, translate('voice_rename.no_cloned_voices_found_matching_that'));
  }

  const voice = await voiceCloneEdit(context, result.id, {name: args.name});
  return editOrReply(context, translate('voice_rename.successfully_renamed_voice_to', {name: Markup.codestring(result.name), name2: Markup.codestring(voice.name)}));
}
