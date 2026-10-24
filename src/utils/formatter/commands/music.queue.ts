import { Command, Interaction, Structures } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentContext, Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic } from '../../../api';
import { RequestContext } from '../../../api/raw';
import { RestResponsesRaw } from '../../../api/types';
import { MessageComponentCustomIds } from '../../../constants';
import PaginatorsStore from '../../../stores/paginators';
import { DisplayPayload, Paginator, chunkArray, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getCachedTranslator, getTranslator } from '../../i18n';

import { createMusicControls, findCommandInvokerId } from './music.controls';
import {
  MUSIC_QUEUED_AT_AFTER,
  musicEffectNames,
  musicItemBatchText,
  musicItemPosition,
  musicItemQueuedAt,
  musicItemTitle,
  musicKnownEffects,
  musicLoopText,
  musicNothingPlayingText,
  musicNowPlaying,
} from './music.shared';


// tracks per page, an album's/playlist's each count
export const RESULTS_PER_PAGE = 10;

export const COMMAND_ID = 'music.queue';

// `music-controls.queue.{page}.{fromUserId}`, the up next list's refresh button (the components listener sends it here)
export const MUSIC_QUEUE_CONTROL = 'queue';

export interface CommandArgs {
  // only what this user queued (what's playing still shows on top)
  from?: null | Structures.Member | Structures.User,
}

export interface MusicQueuePage {
  display: DisplayPayload,
  page: number,
  pageLimit: number,
}

// a page of the queue, fetched now: what's playing on top (its progress bar, where it's playing, who requested it), then
// the up next list (`fromId` only theirs) with its refresh button. null when nothing's playing or queued
export async function createMusicQueuePage(
  context: RequestContext,
  translator: Pick<Translator, 'language' | 'translate'>,
  guildId: string,
  pageNumber: number,
  fromId?: null | string,
): Promise<MusicQueuePage | null> {
  const { language, translate } = translator;
  const music = await fetchGuildMusic(context, guildId).catch(() => null);
  if (!music || (!music.current && !music.queue.length)) {
    return null;
  }

  const current = music.current;
  const guild = VoiceNode.guilds.get(guildId);
  const player = (current) ? await VoiceNode.getPlayer(guildId).catch(() => null) : null;
  const fetchedAt = Date.now();
  const connected = !!player && player.connected;
  // paused too long (or `music leave` kept the queue): we left, the api holds the track where it stopped
  const held = !guild && !!current && music.held_position !== null;
  const paused = held || (!!player && player.paused);
  // where it is: the node's player, or where it's held (or carries on from while joining)
  const progress = player || {paused: true, position: (held) ? music.held_position! : (guild && guild.resumeAt) ? guild.resumeAt.position : 0};

  // their tracks keep their real positions (what's playing is #1, the queue starts at #2)
  const queue = (fromId) ? music.queue.filter((item) => item.user_id === fromId) : music.queue;

  // links that haven't been converted yet have no duration, so the total is at least this long
  const queueDuration = queue.reduce((total, item) => total + ((item.track) ? item.track.duration : 0), 0);
  const queueDurationText = formatTime(queueDuration) + ((queue.some((item) => !item.track)) ? '+' : '');

  // a page is `RESULTS_PER_PAGE` tracks. Back-to-back tracks queued together (an album/playlist, by `batch_id` since
  // names can repeat) are one entry listing each of them, one cut off by the page (or by other tracks between them,
  // like taking turns) goes on as `(continued)`. A lone one shows on its own with where it's from
  const firstOfBatch = new Map<string, string>();
  for (let item of queue) {
    if (item.batch_id && !firstOfBatch.has(item.batch_id)) {
      firstOfBatch.set(item.batch_id, item.id);
    }
  }
  const entriesOf = (items: Array<RestResponsesRaw.GuildMusicQueueItem>): Array<Array<RestResponsesRaw.GuildMusicQueueItem>> => {
    const entries: Array<Array<RestResponsesRaw.GuildMusicQueueItem>> = [];
    for (let item of items) {
      const last = entries[entries.length - 1];
      const previous = last && last[last.length - 1];
      if (previous && item.batch_id && previous.batch_id === item.batch_id && previous.position + 1 === item.position) {
        last.push(item);
      } else {
        entries.push([item]);
      }
    }
    return entries;
  };

  const entryText = (entry: Array<RestResponsesRaw.GuildMusicQueueItem>): string => {
    const [ first ] = entry;
    if (entry.length === 1) {
      return displayDetails([
        `\`${musicItemPosition(music, first)}.\` ${musicItemTitle(first)}`,
        displayDetailsLine([
          (first.track) ? formatTime(first.track.duration) : null,
          `<@${first.user_id}>`,
          musicItemBatchText(translate, first),
          musicItemQueuedAt(first, MUSIC_QUEUED_AT_AFTER),
        ], true),
      ]);
    }
    const last = entry[entry.length - 1];
    const duration = entry.reduce((total, item) => total + ((item.track) ? item.track.duration : 0), 0);
    const sameArtist = entry.every((item) => item.track && first.track && item.track.artist === first.track.artist);
    const name = Markup.escape.all(first.batch_name || translate('music_play.collection'));
    const continued = firstOfBatch.get(first.batch_id!) !== first.id;
    return displayDetails([
      `\`${musicItemPosition(music, first)}–${musicItemPosition(music, last)}.\` ${(continued) ? translate('music_queue.batch_continued', {name}) : name}`,
      displayDetailsLine([
        translate('music_queue.batch_tracks', {count: entry.length.toLocaleString(language)}),
        formatTime(duration) + ((entry.some((item) => !item.track)) ? '+' : ''),
        `<@${first.user_id}>`,
        musicItemQueuedAt(first, MUSIC_QUEUED_AT_AFTER),
      ], true),
      // each of its tracks dashed under it, only their titles when they're all by the same artist (an album, a playlist
      // mixes them). The dash is escaped so it isn't a list bullet
      ...entry.map((item) => {
        const title = (sameArtist && item.source !== 'url' && item.track) ? Markup.escape.all(item.track.title) : musicItemTitle(item);
        return `-# \\- \`${musicItemPosition(music, item)}.\` ${title}`;
      }),
    ]);
  };

  const pages = chunkArray(queue, RESULTS_PER_PAGE).map(entriesOf);
  const pageLimit = Math.max(pages.length, 1);
  pageNumber = Math.min(Math.max(pageNumber, 1), pageLimit);

  // `Music Queue • Paused` (or Playing) above everything, lined off from it
  const payload: DisplayPayload = {
    header: displayDetailsLine([
      translate('music_queue.title'),
      (current) ? translate((paused) ? 'music_info.paused' : 'music_queue.playing') : null,
    ]),
    // like `music info`, who used it is the last line
    invokerLast: true,
  };

  // what's playing stays on top of every page: its progress bar, where it's playing (`playing in #channel • 90ms ping`),
  // then who requested it (like `music info`'s first page)
  if (current) {
    payload.description = displayDetails([
      `**${musicItemTitle(current)}**`,
      musicNowPlaying(current, progress, fetchedAt, [
        // held or disconnected, it's only paused until someone resumes it in their channel
        (held) ? translate('music_info.not_in_voice') : null,
        (guild && guild.channelId && !guild.disconnected) ? translate('music_info.playing_in', {channel: `<#${guild.channelId}>`}) : null,
        // the live effects it plays with (`music effect`), stacked in the order they were picked
        musicEffectNames(musicKnownEffects(player && player.effects)) || null,
        (guild && !connected && !guild.disconnected) ? translate('music_info.connecting') : null,
        (player && connected && 0 <= player.ping) ? translate('music_info.ping', {ping: player.ping}) : null,
      ]),
      displayDetailsLine([
        translate('music_queue.requested_by', {user: `<@${current.user_id}>`}),
        musicItemBatchText(translate, current),
        musicItemQueuedAt(current),
      ], true),
    ]);
    payload.thumbnail = (current.track && current.track.thumbnail) || null;
    // restart, pause/resume and skip under it (above up next), its refresh is up next's
    payload.components = createMusicControls(translate, guildId, {itemId: current.id, paused, refresh: false});
    payload.componentsInside = true;
  } else if (guild) {
    // just joined, the node hasn't taken the first track yet
    payload.description = translate('music_info.connecting');
  } else {
    // we left with it still queued (the join timed out, or the node failed before it took the first track), it waits
    // for the next `music play`
    payload.description = displayDetails([
      translate('music.nothing_playing'),
      `-# ${translate('music_leave.kept')}`,
    ]);
  }

  // `Up next` and how much is queued (`4 queued • 14:51 total`) with its refresh button beside them, the list under it
  const page = pages[pageNumber - 1] || [];
  let upNext = (page.length) ? page.map(entryText) : [translate('music_info.nothing_after')];
  if (fromId) {
    const user = `<@${fromId}>`;
    upNext = (page.length) ? [`-# ${translate('music_queue.requested_by', {user})}`, ...upNext] : [translate('music_queue.nothing_from_user', {user})];
  }
  payload.blocks = [{
    button: {customId: musicQueueRefreshId(pageNumber, fromId), label: translate('music_controls.refresh')},
    content: displayDetails(upNext),
    details: (queue.length) ? displayDetailsLine([
      translate('music_queue.queued', {count: queue.length.toLocaleString(language)}),
      translate('music_queue.total', {duration: queueDurationText}),
    ]) : null,
    heading: translate('music_queue.up_next'),
  }];

  payload.footer = displayDetailsLine([
    (pageLimit !== 1) ? translate('common.page_of', {page: pageNumber, total: pageLimit}) : null,
    musicLoopText(translate, music.loop),
    (music.fair_queue) ? translate('music_queue.fair_queue') : null,
  ]);

  return {display: payload, page: pageNumber, pageLimit};
}

// the page it's on, so the page shows again after the paginator's gone
export function musicQueueRefreshId(page: number, fromId?: null | string): string {
  return [MessageComponentCustomIds.MUSIC_CONTROLS, MUSIC_QUEUE_CONTROL, page, fromId].filter(Boolean).join('.');
}


// the up next refresh button on a queue reply: its page and whose tracks it shows, null on other messages (a click on
// the queue's restart/pause/skip shows the queue again with it)
export function findMusicQueueRefresh(message: Structures.Message): null | {fromId?: string, page?: string} {
  const prefix = musicQueueRefreshId(0) + '.';
  let found: null | {fromId?: string, page?: string} = null;
  const find = (value: any) => {
    if (Array.isArray(value)) {
      return value.forEach(find);
    }
    if (!value || typeof(value) !== 'object' || found) {
      return;
    }
    if (typeof(value.custom_id) === 'string' && value.custom_id.startsWith(prefix)) {
      const [ page, fromId ] = value.custom_id.slice(prefix.length).split('.');
      found = {fromId, page};
      return;
    }
    find(value.components);
    find(value.accessory);
  };
  find(JSON.parse(JSON.stringify(message.components)));
  return found;
}

// the refresh button beside up next, anyone can
export async function onMusicQueueRefresh(context: ComponentContext, page?: string, fromId?: string) {
  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  return rerenderMusicQueue(context, page, fromId);
}

// the queue page is fetched again, through the paginator while it's around
export async function rerenderMusicQueue(context: ComponentContext, page?: string, fromId?: string) {
  const translator = getCachedTranslator(context);
  const guildId = context.guildId;
  const message = context.interaction.message;
  if (!guildId || !message) {
    return;
  }
  const stored = PaginatorsStore.get(message.channelId);
  const paginator = (stored) ? [...stored.normal, ...stored.ephemeral].find((x) => x.messageId === message.id) : undefined;
  if (paginator && !paginator.stopped) {
    return paginator.renderPage(context);
  }

  // the paginator's gone (they expire, a single page never had one): the page goes in its place, a prefixed command's
  // invoker stays
  const queuePage = await createMusicQueuePage(context, translator, guildId, parseInt(page || '1') || 1, fromId);
  const invokerId = await findCommandInvokerId(context, message);
  const display = queuePage ? queuePage.display : {description: musicNothingPlayingText(translator.translate, guildId)};
  return displayReply(context, display, {invokerId: invokerId || undefined});
}


export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs = {}) {
  const translator = await getTranslator(context);

  const guildId = context.guildId;
  const fromId = (args.from) ? args.from.id : null;
  const first = (guildId) ? await createMusicQueuePage(context, translator, guildId, 1, fromId) : null;
  if (!guildId || !first) {
    return displayReply(context, {description: musicNothingPlayingText(translator.translate, guildId)});
  }

  // each page is fetched when it's shown (the first one just was), a page turn or refresh shows the queue as it is now
  let pending: MusicQueuePage | null = first;
  const paginator: Paginator = new Paginator(context, {
    pageLimit: first.pageLimit,
    onPage: async (pageNumber) => {
      const queuePage = (pending && pending.page === pageNumber) ? pending : await createMusicQueuePage(context, translator, guildId, pageNumber, fromId);
      pending = null;
      if (!queuePage) {
        return {display: {description: musicNothingPlayingText(translator.translate, guildId)}};
      }
      paginator.page = queuePage.page;
      paginator.pageLimit = queuePage.pageLimit;
      return {display: queuePage.display};
    },
  });
  return await paginator.start();
}
