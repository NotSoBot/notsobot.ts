import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { voiceCloneTransfer } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { replyError } from '../../../commands/errors';
import { getTranslator } from '../../i18n';
import { DiscordEmojis, StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';

import {
  VoiceClonePlatformTypes,
  VoiceClonePlatforms,
  fetchVoices,
  findVoice,
  serverVoicesProblem,
  voiceCloneAccessProblem,
  voicePlatformText,
} from './voice.list';


export const COMMAND_ID = 'voice.move';

export interface CommandArgs {
  // where it goes, the other one when left out (ZONOS3 <-> fish.audio, an ElevenLabs voice goes to ZONOS3)
  platform?: null | VoiceClonePlatforms,
  // one of the server's voices instead of the user's (needs Manage Server)
  server?: boolean,
  voice: string,
}

// the api clones it again from the clips it kept and deletes it where it was, its id and name stay so defaults and
// scripts keep working. Moving to fish.audio needs plus or NotSoCredits (checked here first, and by the api), to ZONOS3
// is always free
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate, translateMaybe } = await getTranslator(context);
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

  let platformType: number;
  if (args.platform) {
    platformType = VoiceClonePlatformTypes[args.platform];
  } else {
    platformType = (result.platform_type === VoiceClonePlatformTypes.ZONOS3) ? VoiceClonePlatformTypes.FISH_AUDIO : VoiceClonePlatformTypes.ZONOS3;
  }
  const name = Markup.codestring(result.name);
  const platform = voicePlatformText(platformType);
  if (result.platform_type === platformType) {
    return displayReply(context, {description: translate('voice_move.already_on', {name, platform})});
  }

  const accessProblem = await voiceCloneAccessProblem(context, !!args.server, platformType);
  if (accessProblem) {
    return replyError(context, accessProblem);
  }

  // cloning it again takes a while, show it's working (a slash command is deferred by then, this edits it)
  await displayReply(context, {description: `${translate('voice_move.moving', {name, platform})} ${DiscordEmojis.TYPING}`});

  let description: string;
  try {
    const voice = await voiceCloneTransfer(context, result.id, {platformType});
    description = translate('voice_move.moved', {name: Markup.codestring(voice.name), platform});
  } catch(error) {
    // no kept clips (cloned before they were), or the platform can't make voices right now
    const apiError = await getApiError(error);
    if (!apiError) {
      throw error;
    }
    const key = getApiErrorTranslationKey(apiError.code);
    description = `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`;
  }
  return displayReply(context, {description});
}
