import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { DEFAULT_MUSIC_VOLUME, MAX_MUSIC_VOLUME, StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getCachedTranslator, getTranslator } from '../../i18n';

import { musicSoundSettingRefusal } from './music.shared';


export const COMMAND_ID = 'music.volume';

export interface CommandArgs {
  // percent, null shows it
  volume?: null | number,
}

// `150`, `150%`, or `reset`/`default` for 100
export function parseMusicVolume(value: string, context?: Command.Context | Interaction.InteractionContext): null | number {
  const text = (value || '').trim().toLowerCase();
  if (!text) {
    return null;
  }
  if (['default', 'normal', 'off', 'reset'].includes(text)) {
    return DEFAULT_MUSIC_VOLUME;
  }
  const match = /^(\d{1,3})\s*%?$/.exec(text);
  const volume = (match) ? parseInt(match[1]) : NaN;
  if (isNaN(volume) || MAX_MUSIC_VOLUME < volume) {
    throw new Error(getCachedTranslator(context).translate('params.value_between', {max: MAX_MUSIC_VOLUME, min: 0}));
  }
  return volume;
}

// everyone hears it the same (each listener can still set the bot's volume for themselves in discord). Changing it
// (back to 100% too) needs you in our channel, and a dj with dj mode on (`musicSoundSettingRefusal`), it stays after you leave.
// Anything but 100% has the node decode and encode again, so it's a premium server perk (the api's music `premium`)
// like effects, back to 100% isn't. It stays across tracks until the bot leaves
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const percent = (volume: number) => Markup.codestring(`${volume}%`);

  const volume = args.volume;
  if (volume === null || volume === undefined) {
    const player = await VoiceNode.getPlayer(guildId);
    const current = (player && typeof(player.volume) === 'number') ? player.volume : DEFAULT_MUSIC_VOLUME;
    return displayReply(context, {description: translate('music_volume.current', {volume: percent(current)})});
  }

  const refusal = await musicSoundSettingRefusal(context, translate, context.member, guildId);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  if (volume !== DEFAULT_MUSIC_VOLUME && !(await fetchGuildMusic(context, guildId)).premium) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_volume.needs_premium')}`});
  }
  const player = await VoiceNode.setVolume(guildId, volume);
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {
    description: (volume === DEFAULT_MUSIC_VOLUME) ? translate('music_volume.reset') : translate('music_volume.set', {volume: percent(volume)}),
  });
}
