import { Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildMusicSound, fetchGuildMusic } from '../../../api';
import { RequestContext } from '../../../api/raw';
import { RestResponsesRaw } from '../../../api/types';
import { DEFAULT_MUSIC_SPEED, DEFAULT_MUSIC_VOLUME, MusicEffects, MusicEffectsToText, MusicLoopModes, StatusEmojis } from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayLinks, formatTime } from '../../../utils';
import GuildSettingsStore from '../../../stores/guildsettings';
import VoiceNode from '../../../voicenode';
import { Translator } from '../../i18n';


// the api's queue limit for premium servers (100 otherwise), the most positions a range can name
export const MUSIC_QUEUE_PREMIUM_LIMIT = 1000;
const MAX_QUEUE_POSITION = MUSIC_QUEUE_PREMIUM_LIMIT;

// a music dj: the owner, manage server, or the dj role the server picked (`music dj role`, from the cached guild
// settings). Without one picked, any role with "notsomusic" in its name counts
export function canManageMusic(member?: null | Structures.Member): boolean {
  if (!member) {
    return false;
  }
  if (member.isOwner || member.can(Permissions.MANAGE_GUILD)) {
    return true;
  }
  return isMusicDj(member);
}

// has the server's dj role (manage server aside)
export function isMusicDj(member: Structures.Member): boolean {
  const settings = GuildSettingsStore.get(member.guildId);
  const roleId = (settings && settings.settings) ? settings.settings.musicDjRoleId : null;
  if (roleId) {
    return member.roles.has(roleId);
  }
  for (let [, role] of member.roles) {
    if (role && role.name.toLowerCase().includes('notsomusic')) {
      return true;
    }
  }
  return false;
}

// changing what everyone hears that stays on after whoever set it leaves (effects, the volume), turning it back off
// too: you in our voice channel (when we're in one), and with dj mode on only djs (`fetchMusicDjRefusal`), no votes.
// What to reply when they can't, null when they can. Only looking at what's on is open to everyone
export async function musicSoundSettingRefusal(
  context: RequestContext,
  translate: Translator['translate'],
  member: null | Structures.Member | undefined,
  guildId: string,
): Promise<null | string> {
  const guild = VoiceNode.guilds.get(guildId);
  if (guild && guild.channelId) {
    const channel = member && member.voiceState && member.voiceState.channel;
    if (!channel || channel.id !== guild.channelId) {
      return translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`});
    }
  }
  return fetchMusicDjRefusal(context, translate, guildId, member);
}

// not playing (not in voice, held, 24/7 with nothing on, still joining): `music effect clear`, `music volume 100` and
// `music speed 1x` turn the server's saved one back (the api's, what the next play starts with). False when it was
// already that. Check `musicSoundSettingRefusal` first
export async function resetSavedMusicSound(
  context: RequestContext,
  guildId: string,
  setting: 'effects' | 'tempo' | 'volume',
): Promise<boolean> {
  const { sound } = await fetchGuildMusic(context, guildId);
  let changes: {effects?: Array<string>, tempo?: number, volume?: number};
  if (setting === 'effects') {
    if (!sound || !sound.effects.length) {
      return false;
    }
    changes = {effects: []};
  } else if (setting === 'tempo') {
    if (!sound || sound.tempo === DEFAULT_MUSIC_SPEED) {
      return false;
    }
    changes = {tempo: DEFAULT_MUSIC_SPEED};
  } else {
    if (!sound || sound.volume === DEFAULT_MUSIC_VOLUME) {
      return false;
    }
    changes = {volume: DEFAULT_MUSIC_VOLUME};
  }
  await editGuildMusicSound(context, guildId, changes);
  VoiceNode.setStoppedSound(guildId, changes);
  return true;
}

export enum MusicVoteKinds {
  PAUSE = 'pause',
  RESUME = 'resume',
  SKIP = 'skip',
}

// votes for what's playing in each guild (`{kind}.{guildId}`), a new track (another item) starts them over
const musicVotes = new Map<string, {itemId: string, userIds: Set<string>}>();

// who's listening in `channel` (ours, `member`'s in it): not bots, not deafened, `member` always
function musicListeners(member: Structures.Member, channel: Structures.Channel): Set<string> {
  const listeners = new Set<string>([member.id]);
  for (let [, state] of channel.voiceStates) {
    if (state.userId === member.client.userId || (state.member && state.member.bot) || state.deaf || state.selfDeaf) {
      continue;
    }
    listeners.add(state.userId);
  }
  return listeners;
}

// a pause or resume that went through starts the other's votes over (they were for before it)
export function clearMusicVotes(kind: MusicVoteKinds, guildId: string) {
  musicVotes.delete(`${kind}.${guildId}`);
}

// with the server's vote on (`vote`, its `vote_skip`, `vote_pause` or `vote_resume`), only whoever queued `item` (what's playing),
// manage server or the dj role do it right away, or anyone when half of who's listening is just them (two people
// at most). Off, anyone can
export function canControlMusicItem(
  member: Structures.Member,
  channel: Structures.Channel,
  item: RestResponsesRaw.GuildMusicQueueItem,
  vote: boolean,
): boolean {
  if (!vote || item.user_id === member.id || canManageMusic(member)) {
    return true;
  }
  return Math.ceil(musicListeners(member, channel).size / 2) <= 1;
}

// skipping, pausing or resuming `item` (what's playing) from `channel` (ours, they're in it): right away when they can control it
// (`canControlMusicItem`), otherwise a vote until half of who's listening voted. Votes from people who left the channel
// stop counting, `done` clears them
export function musicVote(
  kind: MusicVoteKinds,
  member: Structures.Member,
  channel: Structures.Channel,
  item: RestResponsesRaw.GuildMusicQueueItem,
  vote: boolean,
): {done: boolean, needed: number, votes: number} {
  const key = `${kind}.${member.guildId}`;
  const listeners = musicListeners(member, channel);
  const needed = Math.ceil(listeners.size / 2);
  if (canControlMusicItem(member, channel, item, vote)) {
    musicVotes.delete(key);
    return {done: true, needed, votes: needed};
  }

  let entry = musicVotes.get(key);
  if (!entry || entry.itemId !== item.id) {
    entry = {itemId: item.id, userIds: new Set()};
    musicVotes.set(key, entry);
  }
  entry.userIds.add(member.id);
  const votes = Array.from(entry.userIds).filter((userId) => listeners.has(userId)).length;
  if (needed <= votes) {
    musicVotes.delete(key);
    return {done: true, needed, votes};
  }
  return {done: false, needed, votes};
}

// dj mode (the server's `dj_only`, on by default): controlling the music (skip, pause, resume, seek, loop, leave,
// moving tracks) needs manage server or the dj role, no votes. The reply when they can't, null when they can. Not
// knowing the setting (the api not answering) refuses, like `music leave`
export function musicDjRefusal(
  translate: Translator['translate'],
  member: null | Structures.Member | undefined,
  music: null | Pick<RestResponsesRaw.FetchGuildMusic, 'dj_only'>,
): null | string {
  if (canManageMusic(member) || (music && !music.dj_only)) {
    return null;
  }
  return `${StatusEmojis.WARNING} ${translate('music_dj.locked')}`;
}

// other people's music (leaving with it, removing or moving their tracks): djs, or anyone with dj mode off. Not knowing
// the setting (the api not answering) counts as on
export function canManageOthersMusic(
  member: null | Structures.Member | undefined,
  music: null | Pick<RestResponsesRaw.FetchGuildMusic, 'dj_only'>,
): boolean {
  return canManageMusic(member) || (!!music && !music.dj_only);
}

// `musicDjRefusal`, fetching the setting only when it matters (a dj doesn't wait on the api)
export async function fetchMusicDjRefusal(
  context: RequestContext,
  translate: Translator['translate'],
  guildId: string,
  member: null | Structures.Member | undefined,
): Promise<null | string> {
  if (canManageMusic(member)) {
    return null;
  }
  return musicDjRefusal(translate, member, await fetchGuildMusic(context, guildId).catch(() => null));
}

// 24/7 keeping us in voice: on (it is by default) on a premium server, like the api's `music_stays`
export function musicStays(music: null | Pick<RestResponsesRaw.FetchGuildMusic, 'premium' | 'stay'>): boolean {
  return !!music && music.premium && music.stay;
}

// under `music play`'s reply when we joined a 24/7 server: we'll stay, and how to let us leave
export function musicStayNote(translate: Translator['translate']): string {
  return `-# ${translate('music_stay.stays')} · ${translate('music_stay.off_hint')}`;
}

// `music queue`/`music info` (and the controls) with nothing on: 24/7 keeping us in voice says where we are and how to
// let us leave, otherwise nothing's playing (idle without 24/7 too, we leave soon)
export function musicNothingPlayingText(translate: Translator['translate'], guildId: null | string | undefined): string {
  const guild = (guildId) ? VoiceNode.guilds.get(guildId) : undefined;
  if (guild && guild.idle && !guild.idleTimeout && guild.channelId) {
    return displayDetails([
      translate('music_stay.idle', {channel: `<#${guild.channelId}>`}),
      `-# ${translate('music_stay.off_hint')}`,
    ]);
  }
  return translate('music.nothing_playing');
}

// `2`, `1 3 5`, `1,3,5` or ranges like `5-20`, anything that isn't a positive number (or a range of them) is left out
export function musicQueuePositions(value: string): Array<number> {
  const positions = new Set<number>();
  for (let part of value.split(/[\s,]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Math.max(Math.min(parseInt(range[1]), parseInt(range[2])), 1);
      const end = Math.min(Math.max(parseInt(range[1]), parseInt(range[2])), MAX_QUEUE_POSITION);
      for (let x = start; x <= end; x++) {
        positions.add(x);
      }
    } else {
      const x = parseInt(part);
      if (Number.isSafeInteger(x) && 0 < x) {
        positions.add(x);
      }
    }
  }
  return Array.from(positions);
}

// a link's file name, from its path (the converted file is always `music.weba`), its host when the path has none
// queue items and history entries
type MusicItemLike = Pick<RestResponsesRaw.GuildMusicQueueItem, 'source' | 'track' | 'url'>;

export function musicItemFileName(item: MusicItemLike): string {
  try {
    const url = new URL(item.url);
    const segment = url.pathname.split('/').filter(Boolean).pop();
    let name = url.hostname;
    if (segment) {
      try {
        name = decodeURIComponent(segment);
      } catch {
        name = segment;
      }
    }
    return name.slice(0, 100);
  } catch {
    return item.url.slice(0, 100);
  }
}

// `artist - title`, or a link's file name in a codestring (no markdown from it) linking to it
export function musicItemTitle(item: MusicItemLike): string {
  if (item.source === 'url' || !item.track) {
    return Markup.url(Markup.codestring(musicItemFileName(item)), `<${item.url}>`);
  }
  const { artist, title } = item.track;
  return Markup.escape.all((artist) ? `${artist} - ${title}` : title);
}

// a response's title: `artist - title` linking to its service page, a link's file name (its converted title is always
// `music.weba`) linking to it
export function musicItemDisplayTitle(item: MusicItemLike): Partial<DisplayPayload> {
  const url = (/^https?:\/\//.test(item.url)) ? item.url : null;
  if (item.source === 'url' || !item.track) {
    return {title: Markup.codestring(musicItemFileName(item)), url};
  }
  const { artist, title } = item.track;
  return {title: (artist) ? `${artist} - ${title}` : title, url};
}

// where an item shows in the queue: what's playing is #1, the next one #2. The api's positions start the queue at 1 with
// the playing item at 0, so without one playing the queue starts at #1
export function musicItemPosition(music: {current: null | RestResponsesRaw.GuildMusicQueueItem}, item: RestResponsesRaw.GuildMusicQueueItem): number {
  return (music.current) ? item.position + 1 : item.position;
}

// the queued items at the positions someone typed (as shown, #1 is what's playing and isn't in the queue)
export function musicItemsAtPositions(music: RestResponsesRaw.FetchGuildMusic, positions: Array<number>): Array<RestResponsesRaw.GuildMusicQueueItem> {
  return music.queue.filter((item) => positions.includes(musicItemPosition(music, item)));
}

// the queue only says when a track was queued once it's been there this long (most are minutes old)
export const MUSIC_QUEUED_AT_AFTER = 60 * 60 * 1000;

// when it was queued, a discord timestamp reading `3 days ago` (in their language, it stays up to date). Only once it's
// been queued longer than `after` (milliseconds)
export function musicItemQueuedAt(item: RestResponsesRaw.GuildMusicQueueItem, after: number = 0): null | string {
  if (!item.created || Date.now() - item.created < after) {
    return null;
  }
  return `<t:${Math.floor(item.created / 1000)}:R>`;
}

// a converted link's file on cdn.nsb.gg (the api only gives a link's, once it's converted). Where it's from is the
// title's link already
export function musicItemLinks(item: RestResponsesRaw.GuildMusicQueueItem): string {
  return displayLinks([['File', item.track && item.track.url]]);
}

// `from {name}` for a track queued with an album/playlist, nothing otherwise (the name is only a label, `batch_id` tells
// them apart)
export function musicItemBatchText(translate: Translator['translate'], item: RestResponsesRaw.GuildMusicQueueItem): null | string {
  if (!item.batch_id) {
    return null;
  }
  return translate('music_queue.from_batch', {name: Markup.escape.all(item.batch_name || translate('music_play.collection'))});
}

// the queue's loop as a detail, nothing when it's off
export function musicLoopText(translate: Translator['translate'], loop?: MusicLoopModes | null): null | string {
  switch (loop) {
    case MusicLoopModes.TRACK: return translate('music_loop.track');
    case MusicLoopModes.QUEUE: return translate('music_loop.queue');
  }
  return null;
}

// a live effect (`music effect`)
export type MusicEffect = MusicEffects;

// the live effects we know of from a node's player (or what we last told it), in the order they were picked
export function musicKnownEffects(effects?: null | ReadonlyArray<string>): Array<MusicEffect> {
  return (effects || []).filter((effect) => effect in MusicEffectsToText) as Array<MusicEffect>;
}

// `**Nightcore**`
export function musicEffectName(effect: MusicEffect): string {
  return `**${MusicEffectsToText[effect]}**`;
}

// `**Nightcore** + **Bassboost**`, stacked in the order they were picked
export function musicEffectNames(effects: ReadonlyArray<MusicEffect>): string {
  return effects.map(musicEffectName).join(' + ');
}

// where the player is now, from a `VoiceNode.getPlayer` fetched at `fetchedAt` (paginator pages get shown well after
// it was fetched, so a playing track's position keeps moving from it), never past the track's end
export function musicPlayerPosition(player: any, fetchedAt: number, duration: number): number {
  if (!player) {
    return 0;
  }
  // the track's own time, an effect's speed (nightcore) moves it faster than the clock
  const elapsed = (player.paused) ? 0 : (Date.now() - fetchedAt) * (player.speed || 1);
  return Math.max(Math.min(player.position + elapsed, duration), 0);
}

// how fast a player plays its tracks with the effects and `music speed` (the node's `speed`), 1 without a player
export function musicPlayerSpeed(player: any): number {
  return (player && typeof(player.speed) === 'number' && 0 < player.speed) ? player.speed : 1;
}

// milliseconds of a track (its own time) as how long it takes to hear at `speed`, what every time we show is in
export function musicListeningTime(milliseconds: number, speed: number = 1): number {
  return milliseconds / (speed || 1);
}

// `1.25×`, a `music speed` percent
export function musicSpeedText(percent: number): string {
  return `${Math.round(percent) / 100}×`;
}

const PROGRESS_BAR_LENGTH = 12;

// `1:23` ▬▬▬🔘▬▬▬▬▬▬▬▬ `5:20`, `position` and `duration` in the track's own time, shown as how long they take at `speed`
export function musicProgressBar(position: number, duration: number, speed: number = 1): string {
  const ratio = (duration) ? Math.min(position / duration, 1) : 0;
  const knob = Math.round(ratio * (PROGRESS_BAR_LENGTH - 1));
  const bar = '▬'.repeat(knob) + '🔘' + '▬'.repeat(PROGRESS_BAR_LENGTH - 1 - knob);
  const time = (milliseconds: number) => Markup.codestring(formatTime(musicListeningTime(milliseconds, speed)));
  return `${time(position)} ${bar} ${time(duration)}`;
}

// what's playing in `music queue` and `music info`: its progress bar, then lines of small details (where it's playing,
// its effects...), empty lines are skipped
export function musicNowPlaying(
  item: RestResponsesRaw.GuildMusicQueueItem,
  player: any,
  fetchedAt: number,
  lines: Array<Array<null | string>>,
): string {
  const duration = (item.track) ? item.track.duration : 0;
  return displayDetails([
    (duration) ? musicProgressBar(musicPlayerPosition(player, fetchedAt, duration), duration, musicPlayerSpeed(player)) : null,
    ...lines.map((details) => displayDetailsLine(details, true)),
  ]);
}

// `music pause`/`resume`/`seek`: what it did and the track (`Paused at 1:23 • **artist - title**`), its progress bar
// at `position` under it (links not converted yet have no length, times at `speed`), then small details
export function musicPlaybackText(
  done: string,
  item: null | RestResponsesRaw.GuildMusicQueueItem,
  position: number,
  details: Array<null | string> = [],
  speed: number = 1,
): string {
  const duration = (item && item.track) ? item.track.duration : 0;
  return displayDetails([
    displayDetailsLine([done, (item) ? `**${musicItemTitle(item)}**` : null]),
    (duration) ? musicProgressBar(Math.max(Math.min(position, duration), 0), duration, speed) : null,
    displayDetailsLine(details, true),
  ]);
}

// a track as a small line's details: its length (how long it takes at `speed`) and who requested it (`3:23 • @sam`)
export function musicItemDetails(translate: Translator['translate'], item: RestResponsesRaw.GuildMusicQueueItem, speed: number = 1): Array<null | string> {
  return [
    (item.track && item.track.duration) ? formatTime(musicListeningTime(item.track.duration, speed)) : null,
    translate('music_queue.requested_by', {user: `<@${item.user_id}>`}),
  ];
}
