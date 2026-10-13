import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchUserVoices, voiceCloneAdd } from '../../../api';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';

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
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return displayReply(context, {description: translate('voice_clone_add.you_have_no_cloned_voices')});
  }

  const result = findVoice(voices, args.voice);
  if (!result) {
    return displayReply(context, {description: translate('voice_clone_add.no_cloned_voices_found_matching_that')});
  }

  const voice = await voiceCloneAdd(context, result.id, args);
  return displayReply(context, {description: translate('voice_clone_add.successfully_added_another_audio_file_to_voice', {name: Markup.codestring(voice.name)})});
}
