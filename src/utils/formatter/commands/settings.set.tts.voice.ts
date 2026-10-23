import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import UserSettingsStore from '../../../stores/usersettings';
import { getTranslator } from '../../i18n';

import { editUserSettings, fetchUserVoices } from '../../../api';
import { TTSVoices, TTSVoicesToText } from '../../../constants';
import { displayReply } from '../../../utils';


export const COMMAND_ID = 'settings.set.tts.voice';

// the api saves cloned voices as `CLONED_<id>`, the tts autocomplete gives `CLONED.<id>`
const CLONED_TTS_VOICE_PREFIX = `${TTSVoices.CLONED}_`;

export interface CommandArgs {
  clear?: boolean,
  voice?: string | null,
}

// cloned voices are premium only, anyone else just has the built-in ones
async function fetchVoicesSafe(context: Command.Context | Interaction.InteractionContext): Promise<Array<{id: string, name: string}>> {
  try {
    return (await fetchUserVoices(context, context.userId)).voices;
  } catch(error) {
    return [];
  }
}

// the autocomplete's value, or whatever was typed: a voice's key or name, or one of their cloned voices by name
function parseVoice(value: string, voices: Array<{id: string, name: string}>): string | null {
  const cloned = `${TTSVoices.CLONED}.`;
  if (value.startsWith(cloned)) {
    const id = value.slice(cloned.length);
    return (voices.some((voice) => voice.id === id)) ? `${CLONED_TTS_VOICE_PREFIX}${id}` : null;
  }
  const lower = value.trim().toLowerCase();
  const clonedByName = voices.find((voice) => voice.name.toLowerCase() === lower);
  if (clonedByName) {
    return `${CLONED_TTS_VOICE_PREFIX}${clonedByName.id}`;
  }
  // `CLONED` alone isn't a voice you can save
  const builtIn = Object.entries(TTSVoicesToText).find(([key, name]) => {
    return key !== TTSVoices.CLONED && (key.toLowerCase() === lower || name.toLowerCase() === lower);
  });
  return (builtIn) ? builtIn[0] : null;
}

function voiceToText(value: string, voices: Array<{id: string, name: string}>): string {
  if (value.startsWith(CLONED_TTS_VOICE_PREFIX)) {
    const id = value.slice(CLONED_TTS_VOICE_PREFIX.length);
    const cloned = voices.find((voice) => voice.id === id);
    return (cloned) ? cloned.name : value;
  }
  return (TTSVoicesToText as Record<string, string>)[value] || value;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const [ oldSettings, voices ] = await Promise.all([
    UserSettingsStore.getOrFetch(context, context.userId),
    fetchVoicesSafe(context),
  ]);

  let text: string;
  if (args.voice || args.clear) {
    let voice: string | null = null;
    if (!args.clear) {
      voice = parseVoice(args.voice!, voices);
      if (!voice) {
        return displayReply(context, {description: translate('api_errors.unknown_tts_voice'), ephemeral: true});
      }
    }

    if (oldSettings && oldSettings.tts_voice === voice) {
      if (oldSettings.tts_voice) {
        text = translate('settings_set_tts_voice.your_tts_voice_is_already', {voice: Markup.bold(voiceToText(oldSettings.tts_voice, voices))});
      } else {
        text = translate('settings_set_tts_voice.you_currently_do_not_have_a_tts_voice');
      }
    } else {
      const settings = await editUserSettings(context, context.userId, {ttsVoice: voice});
      UserSettingsStore.insert(context.userId, settings);

      if (settings.tts_voice) {
        text = translate('settings_set_tts_voice.ok_set_your_tts_voice_to', {voice: Markup.bold(voiceToText(settings.tts_voice, voices))});
      } else {
        text = translate('settings_set_tts_voice.ok_cleared_out_your_tts_voice');
      }
    }
  } else {
    if (oldSettings) {
      if (oldSettings.tts_voice) {
        text = translate('settings_set_tts_voice.your_current_tts_voice_is', {voice: Markup.bold(voiceToText(oldSettings.tts_voice, voices))});
      } else {
        text = translate('settings_set_tts_voice.you_currently_do_not_have_a_tts_voice');
      }
    } else {
      text = translate('settings_set_tts_voice.error_fetching_your_current_tts_voice');
    }
  }

  return displayReply(context, {description: text, ephemeral: true});
}
