import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { deleteVoice } from '../../../api';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';

import { fetchVoices, findVoice, serverVoicesProblem } from './voice.list';


export const COMMAND_ID = 'voice.delete';

export interface CommandArgs {
  // one of the server's voices instead of the user's (needs Manage Server)
  server?: boolean,
  voice: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  if (args.server) {
    const problem = serverVoicesProblem(context, true);
    if (problem) {
      return displayReply(context, {description: translate(problem)});
    }
  }

  const { limit, voices } = await fetchVoices(context, args.server);
  if (!voices.length) {
    if (args.server) {
      return displayReply(context, {description: translate('voice_server.no_voices', {max: limit ?? 0})});
    }
    return displayReply(context, {description: translate('voice_delete.you_have_no_cloned_voices')});
  }

  const voice = findVoice(voices, args.voice, true);
  if (!voice) {
    return displayReply(context, {description: translate('voice_delete.no_cloned_voices_found_matching_that')});
  }

  await deleteVoice(context, voice.id);
  return displayReply(context, {description: translate('voice_delete.successfully_deleted_voice', {name: Markup.codestring(voice.name)})});
}
