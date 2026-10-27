import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { DEFAULT_MUSIC_SPEED, MAX_MUSIC_SPEED, MIN_MUSIC_SPEED, StatusEmojis } from '../../../constants';
import { displayDetails, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getCachedTranslator, getTranslator } from '../../i18n';

import { musicPlayerSpeed, musicSoundSettingRefusal, musicSpeedText, resetSavedMusicSound } from './music.shared';


export const COMMAND_ID = 'music.speed';

export interface CommandArgs {
  // percent of the track's own tempo, null shows it
  speed?: null | number,
}

// `1.25`, `1.25x`, `x1.25`, `125%`, or `reset`/`normal` for 1x. A bare number above 4 is a percent (`125`), so `2` is 2x
export function parseMusicSpeed(value: string, context?: Command.Context | Interaction.InteractionContext): null | number {
  const text = (value || '').trim().toLowerCase();
  if (!text) {
    return null;
  }
  if (['default', 'normal', 'off', 'reset'].includes(text)) {
    return DEFAULT_MUSIC_SPEED;
  }
  const match = /^(?:x|×)?\s*(\d{1,3}(?:[.,]\d{1,3})?|[.,]\d{1,3})\s*(%|x|×)?$/.exec(text);
  let speed = NaN;
  if (match) {
    const amount = parseFloat(match[1].replace(',', '.'));
    speed = (match[2] === '%' || (!match[2] && 4 < amount)) ? amount : amount * 100;
  }
  speed = Math.round(speed);
  if (isNaN(speed) || speed < MIN_MUSIC_SPEED || MAX_MUSIC_SPEED < speed) {
    const { translate } = getCachedTranslator(context);
    throw new Error(translate('params.value_between', {max: musicSpeedText(MAX_MUSIC_SPEED), min: musicSpeedText(MIN_MUSIC_SPEED)}));
  }
  return speed;
}

// `1.56× with the effects` under it, when an effect's speed (nightcore) goes with it
function withEffectsText(translate: Translator['translate'], speed: number, player: any): null | string {
  const total = musicPlayerSpeed(player);
  if (Math.abs(total * 100 - speed) < 0.5) {
    return null;
  }
  return `-# ${translate('music_speed.with_effects', {speed: Markup.codestring(musicSpeedText(total * 100))})}`;
}

// faster or slower for everyone, the pitch kept (nightcore and daycore are the ones that change it too). Changing it
// (back to 1x too) needs you in our channel, and a dj with dj mode on (`musicSoundSettingRefusal`), it stays after you
// leave. Anything but 1x has the node decode and encode again, so it's a premium server perk (the api's music `premium`)
// like the volume, back to 1x isn't. It stays across tracks and the bot leaving (saved for the server), and multiplies with the effects' speed.
// Back to 1x with nothing playing resets the saved one (what the next play starts with)
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  const speed = args.speed;
  if (guildId && !VoiceNode.isPlaying(guildId) && speed === DEFAULT_MUSIC_SPEED) {
    const refusal = await musicSoundSettingRefusal(context, translate, context.member, guildId);
    if (refusal) {
      return displayReply(context, {description: refusal});
    }
    await resetSavedMusicSound(context, guildId, 'tempo');
    return displayReply(context, {description: translate('music_speed.reset')});
  }
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const text = (speed: number) => Markup.codestring(musicSpeedText(speed));

  if (speed === null || speed === undefined) {
    const player = await VoiceNode.getPlayer(guildId);
    const current = (player && typeof(player.tempo) === 'number') ? player.tempo : DEFAULT_MUSIC_SPEED;
    return displayReply(context, {
      description: displayDetails([
        translate('music_speed.current', {speed: text(current)}),
        withEffectsText(translate, current, player),
      ]),
    });
  }

  const refusal = await musicSoundSettingRefusal(context, translate, context.member, guildId);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  if (speed !== DEFAULT_MUSIC_SPEED && !(await fetchGuildMusic(context, guildId)).premium) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_speed.needs_premium')}`});
  }
  const player = await VoiceNode.setTempo(guildId, speed);
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  return displayReply(context, {
    description: displayDetails([
      (speed === DEFAULT_MUSIC_SPEED) ? translate('music_speed.reset') : translate('music_speed.set', {speed: text(speed)}),
      withEffectsText(translate, speed, player),
    ]),
  });
}
