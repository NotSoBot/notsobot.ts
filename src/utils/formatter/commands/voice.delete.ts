import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteVoice, fetchUserVoices } from '../../../api';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';

import { findVoice } from './voice.list';


export const COMMAND_ID = 'voice.delete';

export interface CommandArgs {
  voice: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { count, voices } = await fetchUserVoices(context, context.userId);
  if (!voices.length) {
    return displayReply(context, {description: translate('voice_delete.you_have_no_cloned_voices')});
  }

  const voice = findVoice(voices, args.voice);
  if (!voice) {
    return displayReply(context, {description: translate('voice_delete.no_cloned_voices_found_matching_that')});
  }

  await deleteVoice(context, voice.id);
  return displayReply(context, {description: translate('voice_delete.successfully_deleted_voice', {name: Markup.codestring(voice.name)})});
}
