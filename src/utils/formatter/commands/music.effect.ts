import { Command, Interaction } from 'detritus-client';

import { fetchGuildMusic } from '../../../api';
import {
  MAX_MUSIC_EFFECTS,
  MUSIC_EFFECTS_CONFLICTS,
  MUSIC_EFFECTS_FASTER,
  MUSIC_EFFECTS_SLOWER,
  MusicEffects,
  MusicEffectsToText,
  StatusEmojis,
} from '../../../constants';
import { displayDetails, displayDetailsLine, displayReply } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'music.effect';

type Effect = Exclude<MusicEffects, MusicEffects.OFF>;

export interface CommandArgs {
  // stacked in the order given, `off` anywhere turns them all off. None shows what's on
  effects?: Array<MusicEffects>,
}

// what of `picked` stacks, in its order: up to `MAX_MUSIC_EFFECTS`, a faster one never with a slower one, and none that
// undo one already kept (`MUSIC_EFFECTS_CONFLICTS`). The first picked wins, the rest are left out
export function stackMusicEffects(picked: Array<MusicEffects>): {conflicting: Array<Effect>, extra: Array<Effect>, kept: Array<Effect>} {
  const conflicting: Array<Effect> = [], extra: Array<Effect> = [], kept: Array<Effect> = [];
  for (const effect of picked) {
    if (effect === MusicEffects.OFF || kept.includes(effect)) {
      continue;
    }
    const clashes = kept.some((other) => {
      const speeds = (MUSIC_EFFECTS_FASTER.includes(effect) && MUSIC_EFFECTS_SLOWER.includes(other)) ||
        (MUSIC_EFFECTS_SLOWER.includes(effect) && MUSIC_EFFECTS_FASTER.includes(other));
      return speeds || MUSIC_EFFECTS_CONFLICTS.some(([a, b]) => (a === effect && b === other) || (a === other && b === effect));
    });
    if (clashes) {
      conflicting.push(effect);
    } else if (MAX_MUSIC_EFFECTS <= kept.length) {
      extra.push(effect);
    } else {
      kept.push(effect);
    }
  }
  return {conflicting, extra, kept};
}

// live effects on what's playing, stacked (the node decodes, filters and encodes it again), they stay on for the next
// tracks until they're turned off or the bot leaves. A premium server perk (the api's music `premium`), turning them off
// isn't. Ones that don't stack are left out (cheaper than an error), the reply says which. Nothing given shows what's on
// and the ones there are
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  const describe = (effect: Effect) => {
    return displayDetailsLine([`**${MusicEffectsToText[effect]}**`, translate(`music_effect.${effect}`)]);
  };
  const names = (effects: Array<Effect>) => effects.map((effect) => `**${MusicEffectsToText[effect]}**`).join(' + ');

  const picked = args.effects || [];
  if (!picked.length) {
    const player = await VoiceNode.getPlayer(guildId);
    const current = ((player && player.effects) || []).filter((effect) => effect in MusicEffectsToText) as Array<Effect>;
    const effects = Object.values(MusicEffects).filter((effect) => effect !== MusicEffects.OFF) as Array<Effect>;
    return displayReply(context, {
      description: [
        (current.length) ? translate('music_effect.current', {effect: names(current)}) : translate('music_effect.none'),
        '',
        ...effects.map(describe),
      ].join('\n'),
    });
  }

  const { conflicting, extra, kept } = (picked.includes(MusicEffects.OFF)) ?
    {conflicting: [], extra: [], kept: []} :
    stackMusicEffects(picked);
  if (kept.length && !(await fetchGuildMusic(context, guildId)).premium) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_effect.needs_premium')}`});
  }
  const player = await VoiceNode.setEffects(guildId, kept);
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  if (!kept.length) {
    return displayReply(context, {description: translate('music_effect.off')});
  }
  return displayReply(context, {
    description: displayDetails([
      ...kept.map(describe),
      (conflicting.length) ? `-# ${translate('music_effect.conflicting', {effects: names(conflicting)})}` : null,
      (extra.length) ? `-# ${translate('music_effect.too_many', {count: MAX_MUSIC_EFFECTS, effects: names(extra)})}` : null,
    ]),
  });
}
