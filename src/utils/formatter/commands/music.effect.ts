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
import { Languages, Translator, getTranslator, getTranslatorForLanguage, languageFromLocale } from '../../i18n';

import { MusicEffect, musicEffectName, musicEffectNames, musicKnownEffects, musicSoundSettingRefusal } from './music.shared';


export const COMMAND_ID = 'music.effect';

export type Effect = MusicEffect;

export interface CommandArgs {
  // stacked in the order given. None shows what's on
  effects?: Array<MusicEffects>,
}

// the ones that fold the sound to one channel (radio's one speaker, the gramophone's horn), wide, both 8ds and crossfeed
// have no stereo left to work with after
const MUSIC_EFFECTS_ONE_CHANNEL: ReadonlyArray<MusicEffects> = Object.freeze([MusicEffects.MONO, MusicEffects.RADIO, MusicEffects.OLD_RECORD]);

// the ones that move the song around your head, two of them blur together
const MUSIC_EFFECTS_ORBITS: ReadonlyArray<MusicEffects> = Object.freeze([MusicEffects.EIGHT_D, MusicEffects.EIGHT_D_VERTICAL]);

// the listening ones (not much of an effect), last in the add picker when nothing's typed: there are more effects than
// the 25 choices discord shows, typing finds these
const MUSIC_EFFECTS_PICKER_LAST: ReadonlyArray<MusicEffects> = Object.freeze([
  MusicEffects.CROSSFEED,
  MusicEffects.MONO,
  MusicEffects.NORMALIZER,
  MusicEffects.WIDE,
]);

// the first of `others` that `effect` doesn't stack with: a faster one with a slower one, or ones that undo each other
// (`MUSIC_EFFECTS_CONFLICTS`)
export function findMusicEffectClash(effect: Effect, others: ReadonlyArray<Effect>): Effect | null {
  const clash = others.find((other) => {
    const speeds = (MUSIC_EFFECTS_FASTER.includes(effect) && MUSIC_EFFECTS_SLOWER.includes(other)) ||
      (MUSIC_EFFECTS_SLOWER.includes(effect) && MUSIC_EFFECTS_FASTER.includes(other));
    return speeds || MUSIC_EFFECTS_CONFLICTS.some(([a, b]) => (a === effect && b === other) || (a === other && b === effect));
  });
  return clash || null;
}

// what of `picked` stacks, in its order: up to `MAX_MUSIC_EFFECTS` (the same one again stacks it again), a faster one
// never with a slower one, and none that undo one already kept. The first picked wins, the rest are left out
// (`conflicting` with the kept one they clash with)
export function stackMusicEffects(picked: Array<MusicEffects>): {
  conflicting: Array<{effect: Effect, other: Effect}>,
  extra: Array<Effect>,
  kept: Array<Effect>,
} {
  const conflicting: Array<{effect: Effect, other: Effect}> = [], extra: Array<Effect> = [], kept: Array<Effect> = [];
  for (const effect of picked) {
    const other = findMusicEffectClash(effect, kept);
    if (other) {
      conflicting.push({effect, other});
    } else if (MAX_MUSIC_EFFECTS <= kept.length) {
      extra.push(effect);
    } else {
      kept.push(effect);
    }
  }
  return {conflicting, extra, kept};
}

// which of `after` are new since `before`, by position: each one in `before` only accounts for one in `after`, so a
// second Bassboost is the one added
function addedPositions(before: ReadonlyArray<Effect>, after: ReadonlyArray<Effect>): Array<number> {
  const left = before.slice();
  const positions: Array<number> = [];
  after.forEach((effect, index) => {
    const found = left.indexOf(effect);
    if (found === -1) {
      positions.push(index);
    } else {
      left.splice(found, 1);
    }
  });
  return positions;
}

// every one by name (the slash pickers and `music effect list`)
export const MUSIC_EFFECTS_SORTED: ReadonlyArray<Effect> = Object.freeze(Object.values(MusicEffects).sort((x, y) => {
  return MusicEffectsToText[x].localeCompare(MusicEffectsToText[y]);
}));

// a slash option's value: an effect by its value or name (autocomplete lets them send what they typed), null otherwise
export function parseMusicEffect(value: string): Effect | null {
  const text = value.trim().toLowerCase();
  return MUSIC_EFFECTS_SORTED.find((effect) => effect === text || MusicEffectsToText[effect].toLowerCase() === text) || null;
}

async function fetchCurrentEffects(guildId: string): Promise<Array<Effect>> {
  const player = await VoiceNode.getPlayer(guildId);
  return musicKnownEffects(player && player.effects);
}

// what we last told the node, for the pickers (no time to ask it)
function cachedCurrentEffects(guildId: null | string | undefined): Array<Effect> {
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  return musicKnownEffects(guild && guild.effects);
}

function describeEffect(translate: Translator['translate'], effect: Effect): string {
  return displayDetailsLine([musicEffectName(effect), translate(`music_effect.${effect}`)]);
}

// why `effect` didn't stack with `other` (`findMusicEffectClash`): one speeds it up and the other slows it down, one
// raises the pitch and the other lowers it, both move it around your head, karaoke keeps only the stereo sides that the
// other folds together, or the other has no stereo left after one channel
function describeClash(translate: Translator['translate'], effect: Effect, other: Effect): string {
  if (MUSIC_EFFECTS_FASTER.includes(effect) || MUSIC_EFFECTS_FASTER.includes(other)) {
    const faster = (MUSIC_EFFECTS_FASTER.includes(effect)) ? effect : other;
    return translate('music_effect.reason_speed', {faster: musicEffectName(faster), slower: musicEffectName((faster === effect) ? other : effect)});
  }
  if (effect === MusicEffects.CHIPMUNK || other === MusicEffects.CHIPMUNK) {
    return translate('music_effect.reason_pitch', {higher: musicEffectName(MusicEffects.CHIPMUNK), lower: musicEffectName(MusicEffects.DEEP)});
  }
  if (MUSIC_EFFECTS_ORBITS.includes(effect) && MUSIC_EFFECTS_ORBITS.includes(other)) {
    return translate('music_effect.reason_orbit', {effect: musicEffectName(effect), other: musicEffectName(other)});
  }
  if (effect === MusicEffects.KARAOKE || other === MusicEffects.KARAOKE) {
    return translate('music_effect.reason_karaoke', {
      karaoke: musicEffectName(MusicEffects.KARAOKE),
      other: musicEffectName((effect === MusicEffects.KARAOKE) ? other : effect),
    });
  }
  const mono = (MUSIC_EFFECTS_ONE_CHANNEL.includes(effect)) ? effect : other;
  return translate('music_effect.reason_mono', {mono: musicEffectName(mono), stereo: musicEffectName((mono === effect) ? other : effect)});
}

// puts `picked` on in place of `before` (what's on, stacked as `stackMusicEffects` allows). The reply heads with the one
// just added, then what's on numbered in order and why any were left out, then how many slots are used. Any change
// (taking them off too) needs you in our channel, and a dj with dj mode on (`musicSoundSettingRefusal`), they stay on
// after you leave. A premium server perk (the api's music `premium`) to put any on, taking some off isn't
async function applyEffects(
  context: Command.Context | Interaction.InteractionContext,
  guildId: string,
  picked: Array<MusicEffects>,
  before: Array<Effect>,
  removing: boolean = false,
) {
  const { translate } = await getTranslator(context);

  const refusal = await musicSoundSettingRefusal(context, translate, context.member, guildId);
  if (refusal) {
    return displayReply(context, {description: refusal});
  }
  const { conflicting, extra, kept } = stackMusicEffects(picked);
  if (kept.length && !removing && !(await fetchGuildMusic(context, guildId)).premium) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_effect.needs_premium')}`});
  }
  const player = await VoiceNode.setEffects(guildId, kept);
  if (!player) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  if (!kept.length) {
    return displayReply(context, {description: translate('music_effect.off')});
  }

  const positions = addedPositions(before, kept);
  const added = positions.map((index) => kept[index]);
  const content = displayDetails([
    // `1. Nightcore • Faster and higher`, `just added` only tells them apart when some were on already
    ...kept.map((effect, index) => displayDetailsLine([
      `**${index + 1}.** ${musicEffectName(effect)}`,
      translate(`music_effect.${effect}`),
      (positions.includes(index) && added.length < kept.length) ? translate('music_effect.just_added') : null,
    ])),
    ...conflicting.map(({ effect, other }) => {
      return `-# ${translate('music_effect.not_added', {effect: musicEffectName(effect), other: musicEffectName(other), reason: describeClash(translate, effect, other)})}`;
    }),
    (extra.length) ? `-# ${translate('music_effect.not_added_full', {count: MAX_MUSIC_EFFECTS, effects: musicEffectNames(extra)})}` : null,
  ]);
  // `2 of 5 effects • stays on for the next tracks • /music effect remove takes one off`
  const footer = displayDetailsLine([
    translate('music_effect.slots', {count: kept.length, max: MAX_MUSIC_EFFECTS}),
    translate('music_effect.stays_on'),
    (context instanceof Interaction.InteractionContext) ? translate('music_effect.remove_hint', {command: '/music effect remove'}) : null,
  ]);

  // one just added heads the reply with what it does, the stack under it
  if (added.length === 1 && !removing) {
    return displayReply(context, {
      blocks: [{content}],
      description: translate(`music_effect.${added[0]}`),
      footer,
      header: translate('music_effect.added'),
      title: MusicEffectsToText[added[0]],
    });
  }
  return displayReply(context, {description: content, footer});
}

// live effects on what's playing, stacked (the node decodes, filters and encodes it again), they stay on for the next
// tracks until they're turned off (`music effect clear`) or the bot leaves. These replace what's on. Ones that don't
// stack are left out (cheaper than an error), the reply says which and why. Nothing given shows what's on and the ones
// there are
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs) {
  const picked = args.effects || [];
  if (!picked.length) {
    return createListMessage(context);
  }

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    const { translate } = await getTranslator(context);
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const before = await fetchCurrentEffects(guildId);
  return applyEffects(context, guildId, picked, before);
}

// stacks one more on top of what's on (`/music effect add`), null when what they typed isn't one
export async function createAddMessage(context: Command.Context | Interaction.InteractionContext, args: {effect: Effect | null}) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  if (!args.effect) {
    return displayReply(context, {description: translate('music_effect.unknown')});
  }
  const before = await fetchCurrentEffects(guildId);
  return applyEffects(context, guildId, [...before, args.effect], before);
}

// takes one off what's on, the last of it when it's stacked more than once (`/music effect remove`). One that isn't on
// shows what is
export async function createRemoveMessage(context: Command.Context | Interaction.InteractionContext, args: {effect: Effect | null}) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const current = await fetchCurrentEffects(guildId);
  if (!args.effect || !current.includes(args.effect)) {
    return displayReply(context, {
      description: (current.length) ? translate('music_effect.current', {effect: musicEffectNames(current)}) : translate('music_effect.none'),
    });
  }
  const removing = current.lastIndexOf(args.effect);
  return applyEffects(context, guildId, current.filter((effect, index) => index !== removing), current, true);
}

// takes every one off (`music effect clear`), none on says so
export async function createClearMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const current = await fetchCurrentEffects(guildId);
  if (!current.length) {
    return displayReply(context, {description: translate('music_effect.none')});
  }
  return applyEffects(context, guildId, [], current, true);
}

// what's on, then every effect there is with what it does (`/music effect list`, `music effect` with nothing given)
export async function createListMessage(context: Command.Context | Interaction.InteractionContext) {
  const { translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId || !VoiceNode.isPlaying(guildId)) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }
  const current = await fetchCurrentEffects(guildId);
  return displayReply(context, {
    description: [
      (current.length) ? translate('music_effect.current', {effect: musicEffectNames(current)}) : translate('music_effect.none'),
      '',
      ...MUSIC_EFFECTS_SORTED.map((effect) => describeEffect(translate, effect)),
    ].join('\n'),
  });
}


// the effects matching what they typed (its value or name), all of them for nothing typed (`MUSIC_EFFECTS_PICKER_LAST`
// at the end)
function matchingEffects(value: string, effects: ReadonlyArray<Effect>): Array<Effect> {
  const text = value.trim().toLowerCase();
  if (!text) {
    return [
      ...effects.filter((effect) => !MUSIC_EFFECTS_PICKER_LAST.includes(effect)),
      ...effects.filter((effect) => MUSIC_EFFECTS_PICKER_LAST.includes(effect)),
    ];
  }
  return effects.filter((effect) => effect.includes(text) || MusicEffectsToText[effect].toLowerCase().includes(text));
}

// `/music effect add`'s picker, for what's on now: `Bassboost — More bass`, the ones that can go on first (one that's on
// can go on again), then the ones that can't and why (`Daycore — doesn't work with Nightcore`, all of them once it's full)
export function autoCompleteAdd(context: Interaction.InteractionAutoCompleteContext) {
  const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
  const current = cachedCurrentEffects(context.guildId);

  const available: Array<{name: string, value: string}> = [];
  const unavailable: Array<{name: string, value: string}> = [];
  for (const effect of matchingEffects(context.value, MUSIC_EFFECTS_SORTED)) {
    const clash = findMusicEffectClash(effect, current);
    let detail: string;
    if (clash) {
      detail = translate('music_effect.choice_clash', {effect: MusicEffectsToText[clash]});
    } else if (MAX_MUSIC_EFFECTS <= current.length) {
      detail = translate('music_effect.choice_full', {count: current.length});
    } else {
      available.push({name: `${MusicEffectsToText[effect]} — ${translate(`music_effect.${effect}`)}`.slice(0, 100), value: effect});
      continue;
    }
    unavailable.push({name: `${MusicEffectsToText[effect]} — ${detail}`.slice(0, 100), value: effect});
  }
  return context.respond({choices: [...available, ...unavailable].slice(0, 25)});
}

// `/music effect remove`'s picker: only what's on, with what it does, once each (`Bassboost ×2 — More bass` when it's
// stacked, picking it takes one off)
export function autoCompleteRemove(context: Interaction.InteractionAutoCompleteContext) {
  const { translate } = getTranslatorForLanguage(languageFromLocale(context.locale) || Languages.ENGLISH);
  const current = cachedCurrentEffects(context.guildId);
  const choices = matchingEffects(context.value, Array.from(new Set(current))).map((effect) => {
    const count = current.filter((other) => other === effect).length;
    const name = (1 < count) ? `${MusicEffectsToText[effect]} ×${count}` : MusicEffectsToText[effect];
    return {name: `${name} — ${translate(`music_effect.${effect}`)}`.slice(0, 100), value: effect};
  });
  return context.respond({choices: choices.slice(0, 25)});
}
