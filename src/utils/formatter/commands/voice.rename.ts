import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { voiceCloneEdit } from '../../../api';
import { getTranslator } from '../../i18n';
import { displayReply } from '../../../utils';

import { fetchVoices, findVoice, serverVoicesProblem } from './voice.list';


export const COMMAND_ID = 'voice.rename';

export interface CommandArgs {
  // one of the server's voices instead of the user's (needs Manage Server)
  server?: boolean,
  name: string,
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
    return displayReply(context, {description: translate('voice_rename.you_have_no_cloned_voices')});
  }

  const result = findVoice(voices, args.voice);
  if (!result) {
    return displayReply(context, {description: translate('voice_rename.no_cloned_voices_found_matching_that')});
  }

  const voice = await voiceCloneEdit(context, result.id, {name: args.name});
  return displayReply(context, {description: translate('voice_rename.successfully_renamed_voice_to', {name: Markup.codestring(result.name), name2: Markup.codestring(voice.name)})});
}
