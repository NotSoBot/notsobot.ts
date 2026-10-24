import { Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, MessageComponentTypes, MessageFlags } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import {
  deleteGuildMusicQueue,
  editGuildMusicQueueItem,
  editGuildMusicSession,
  fetchGuildMusic,
  postGuildMusicNext,
} from '../../../api';
import { RequestContext } from '../../../api/raw';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, MessageComponentCustomIds } from '../../../constants';
import PaginatorsStore from '../../../stores/paginators';
import { DisplayPayload, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getCachedTranslator } from '../../i18n';

import {
  canManageMusic,
  musicItemBatchText,
  musicItemDisplayTitle,
  musicItemLinks,
  musicItemQueuedAt,
  musicNowPlaying,
  musicLoopText,
  musicPlayerPosition,
} from './music.shared';


export enum MusicControls {
  // a queued track goes next (theirs, or anyone's with manage server or a notsomusic role)
  PLAY_NEXT = 'next',
  // the page again, fetched now (where it's at, paused or not), anyone can
  REFRESH = 'refresh',
  // what's playing from the start, paused stays paused
  RESTART = 'restart',
  SKIP = 'skip',
  // pause and resume never toggle, an out of date button does what it shows (an old play button only resumes)
  PAUSE = 'pause',
  RESUME = 'resume',
}

export interface MusicControlsOptions {
  // the track the page is about, its buttons show it again after a click (`music-controls.{control}.{itemId}`)
  itemId?: null | string,
  paused?: boolean,
  // a queued track that isn't next already
  playNext?: boolean,
  // a queued track's page has no restart, pause/resume or skip, they're for what's playing
  queued?: boolean,
  // the pages have it beside their queue line instead (`musicControlId`)
  refresh?: boolean,
}

// `music-controls.{control}`, with the track a page was about after it
export function musicControlId(control: MusicControls, itemId?: null | string): string {
  return [MessageComponentCustomIds.MUSIC_CONTROLS, control, itemId].filter(Boolean).join('.');
}

// the buttons on `music play` and `music info`, a click from any of them goes through the components listener
// (`onMusicControl`), so they work for as long as the reply is around. `paused` for when the guild's state doesn't
// show it yet (resuming after being disconnected only unpauses once we're back in voice)
export function createMusicControls(translate: Translator['translate'], guildId: string, options: MusicControlsOptions = {}): Components {
  let paused = options.paused;
  if (paused === undefined) {
    const guild = VoiceNode.guilds.get(guildId);
    paused = !!guild && !!guild.paused;
  }
  const customId = (control: MusicControls) => musicControlId(control, options.itemId);

  const components = new Components();
  // icons for what's playing, pause/resume shows what a click does (play while paused)
  if (!options.queued) {
    components.createButton({
      customId: customId(MusicControls.RESTART),
      emoji: DiscordEmojis.MUSIC.RESTART,
      style: MessageComponentButtonStyles.SECONDARY,
    });
    components.createButton({
      customId: customId((paused) ? MusicControls.RESUME : MusicControls.PAUSE),
      emoji: (paused) ? DiscordEmojis.MUSIC.PLAY : DiscordEmojis.MUSIC.PAUSE,
      style: MessageComponentButtonStyles.SECONDARY,
    });
    components.createButton({
      customId: customId(MusicControls.SKIP),
      emoji: DiscordEmojis.MUSIC.SKIP,
      style: MessageComponentButtonStyles.SECONDARY,
    });
  }
  if (options.playNext && options.itemId) {
    components.createButton({
      customId: customId(MusicControls.PLAY_NEXT),
      label: translate('music_controls.play_next'),
      style: MessageComponentButtonStyles.SECONDARY,
    });
  }
  if (options.refresh !== false) {
    components.createButton({
      customId: customId(MusicControls.REFRESH),
      label: translate('music_controls.refresh'),
      style: MessageComponentButtonStyles.SECONDARY,
    });
  }
  return components;
}


export interface MusicPageOptions {
  // `music play`'s track says it was added (`Added to Queue #3`) until it plays
  addedItemId?: null | string,
  // an album's/playlist's remove button (`music play`), while some of it's still queued
  batchId?: null | string,
  // the track to show, wherever it is now. `page` when it's not queued anymore (or none's given)
  itemId?: null | string,
  page?: number,
  paused?: boolean,
}

export interface MusicPage {
  display: DisplayPayload,
  itemId: string,
  // the track's position: what's playing is #1, the queue after it
  page: number,
  pageLimit: number,
}

// a page of what's playing and queued, fetched now. #1 is what's playing (its progress bar, paused, where), the queue's
// tracks after it (when they start). `music info` and `music play` page through them, a click on the controls shows
// the page again. null when nothing's playing or queued (held music, we're not in voice)
export async function createMusicPage(
  context: RequestContext,
  translator: Pick<Translator, 'language' | 'translate'>,
  guildId: string,
  options: MusicPageOptions = {},
): Promise<MusicPage | null> {
  const { language, translate } = translator;
  const guild = VoiceNode.guilds.get(guildId);
  const music = await fetchGuildMusic(context, guildId).catch(() => null);
  // paused too long (or `music leave` kept the queue): we left, the api holds the track where it stopped
  const held = !guild && !!music && !!music.current && music.held_position !== null;
  // the first one's playing (or held), or about to (we just joined, the node hasn't taken it yet)
  const items = (music) ? ((music.current) ? [music.current, ...music.queue] : music.queue) : [];
  if ((!guild && !held) || !music || !items.length) {
    return null;
  }

  let index = (options.itemId) ? items.findIndex((item) => item.id === options.itemId) : -1;
  if (index === -1) {
    index = Math.min(Math.max((options.page || 1) - 1, 0), items.length - 1);
  }
  const item = items[index];
  const position = index + 1;
  const playing = index === 0;

  const player = (guild && music.current) ? await VoiceNode.getPlayer(guildId).catch(() => null) : null;
  const fetchedAt = Date.now();
  const connected = !!player && player.connected;
  const paused = (options.paused !== undefined) ? options.paused : held || (!!player && player.paused);
  // held, or joining (no player yet) to carry on from where it was held
  const progress = player || {paused: true, position: (held) ? music.held_position! : (guild && guild.resumeAt) ? guild.resumeAt.position : 0};
  // what's left of a track, the playing one from where it is (links not converted yet have no length)
  const left = (x: RestResponsesRaw.GuildMusicQueueItem, i: number): number => {
    const duration = (x.track) ? x.track.duration : 0;
    return (i === 0 && music.current) ? duration - musicPlayerPosition(progress, fetchedAt, duration) : duration;
  };
  const leftText = (list: Array<RestResponsesRaw.GuildMusicQueueItem>): string => {
    const total = list.reduce((total, x, i) => total + left(x, i), 0);
    return Markup.codestring(formatTime(total) + ((list.some((x) => !x.track)) ? '+' : ''));
  };

  const requestedBy = translate('music_queue.requested_by', {user: `<@${item.user_id}>`});
  let description: string;
  if (playing) {
    // the progress bar, where it's playing (`playing in #channel • 90ms ping`), then who requested it
    description = displayDetails([
      musicNowPlaying(item, progress, fetchedAt, [
        // held or disconnected, it's only paused until someone resumes it in their channel
        (held) ? translate('music_info.not_in_voice') : null,
        (guild && guild.channelId && !guild.disconnected) ? translate('music_info.playing_in', {channel: `<#${guild.channelId}>`}) : null,
        (guild && !connected && !guild.disconnected) ? translate('music_info.connecting') : null,
        (player && connected && 0 <= player.ping) ? translate('music_info.ping', {ping: player.ping}) : null,
      ]),
      displayDetailsLine([requestedBy, musicItemBatchText(translate, item), musicItemQueuedAt(item)], true),
      musicItemLinks(item),
    ]);
  } else {
    description = displayDetails([
      displayDetailsLine([
        (item.track && item.track.duration) ? Markup.codestring(formatTime(item.track.duration)) : null,
        (item.track && item.track.album) ? Markup.escape.all(item.track.album) : null,
      ]),
      displayDetailsLine([requestedBy, musicItemBatchText(translate, item), musicItemQueuedAt(item)], true),
      musicItemLinks(item),
    ]);
  }

  const components = createMusicControls(translate, guildId, {itemId: item.id, paused, playNext: 1 < index, queued: !playing, refresh: false});
  if (options.batchId && music.queue.some((x) => x.batch_id === options.batchId)) {
    addMusicBatchRemove(components, translate, options.batchId);
  }

  let header: null | string = null;
  if (playing) {
    // paused shows in place of `Now Playing`
    header = translate((paused) ? 'music_info.paused' : 'music_play.title_playing');
  } else if (options.addedItemId === item.id) {
    header = translate('music_play.title_queued', {position: Markup.codestring(`#${position.toLocaleString(language)}`)});
  }

  return {
    display: {
      ...musicItemDisplayTitle(item),
      components,
      description,
      // `Queue #2 of 5 • 3:21 until this plays • Looping the queue • taking turns`, then `12:34 total` under it. Only
      // what's playing is `nothing in queue after this` (its progress bar shows what's left)
      footer: [
        displayDetailsLine([
          (items.length === 1) ?
            translate('music_info.nothing_after') :
            translate('music_info.queue_position', {position: position.toLocaleString(language), total: items.length.toLocaleString(language)}),
          // what's left of everything before it, nothing for what's playing
          (playing) ? null : translate('music_info.until_plays', {duration: leftText(items.slice(0, index))}),
          musicLoopText(translate, music.loop),
          (music.fair_queue) ? translate('music_queue.fair_queue') : null,
        ]),
        // what's left of the playing track and everything queued, when any of it has a length
        (1 < items.length && items.some((x) => x.track && x.track.duration)) ? translate('music_queue.total', {duration: leftText(items)}) : null,
      ].filter(Boolean).join('\n'),
      // beside the queue line, under the controls
      footerButton: {customId: musicControlId(MusicControls.REFRESH, item.id), label: translate('music_controls.refresh')},
      header,
      thumbnail: (item.track && item.track.thumbnail) || null,
    },
    itemId: item.id,
    page: position,
    pageLimit: items.length,
  };
}


// `music-batch.{batchId}`, on an album's/playlist's `music play` reply: removes what's still queued of it, in its own
// row (the controls' row is swapped on its own). Disabled with how many went once it's used
export function addMusicBatchRemove(components: Components, translate: Translator['translate'], batchId: string, removed?: string) {
  const row = components.createActionRow();
  row.createButton({
    customId: `${MessageComponentCustomIds.MUSIC_BATCH}.${batchId}`,
    disabled: removed !== undefined,
    label: (removed === undefined) ? translate('music_controls.remove_batch') : translate('music_queue_remove.removed', {count: removed}),
    style: MessageComponentButtonStyles.DANGER,
  });
}


// whoever queued them can remove them, other people need manage server or a notsomusic role
export async function onMusicBatchRemove(context: ComponentContext, batchId: string) {
  const { language, translate } = getCachedTranslator(context);
  const guildId = context.guildId;
  if (!guildId) {
    return;
  }
  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

  const music = await fetchGuildMusic(context, guildId);
  const items = music.queue.filter((item) => item.batch_id === batchId);
  if (items.some((item) => item.user_id !== context.userId) && !canManageMusic(context.member)) {
    return context.createMessage({content: translate('music_queue_remove.not_yours'), flags: MessageFlags.EPHEMERAL});
  }
  const { deleted } = (items.length) ? await deleteGuildMusicQueue(context, guildId, {batchId}) : {deleted: 0};

  const message = context.interaction.message;
  if (message) {
    const done = new Components();
    addMusicBatchRemove(done, translate, batchId, deleted.toLocaleString(language));
    const components = replaceComponentsRow(message, MessageComponentCustomIds.MUSIC_BATCH, done);
    if (components) {
      await context.editOrRespond({allowedMentions: {parse: []}, components});
    }
  }
}


// restarting, pausing/resuming and skipping need you in the music's channel (anyone while we're disconnected, resuming
// joins their channel). Held music (we left, paused too long) is like a stopped player: only play joins (their
// channel), restart and skip move where it's held. Anyone can refresh, play next is for your own tracks (or anyone's
// with manage server or a notsomusic role). `itemId` is the track the page was about, the page that shows it now is
// shown again. `rerender` shows the message again in place of its own pages (a `music queue` reply)
export async function onMusicControl(
  context: ComponentContext,
  control: string,
  itemId?: string,
  rerender?: (context: ComponentContext) => Promise<any>,
) {
  // cached only, the click has to be answered quickly
  const translator = getCachedTranslator(context);
  const { translate } = translator;
  const reply = (content: string) => {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {content, flags: MessageFlags.EPHEMERAL});
  };
  const followUp = (content: string) => {
    return context.createMessage({content, flags: MessageFlags.EPHEMERAL});
  };

  const guildId = context.guildId;
  if (!guildId) {
    return reply(translate('music.nothing_playing'));
  }
  const guild = VoiceNode.guilds.get(guildId);
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  const playback = [MusicControls.PAUSE, MusicControls.RESTART, MusicControls.RESUME, MusicControls.SKIP] as Array<string>;

  if (!guild && playback.includes(control)) {
    if (control === MusicControls.RESUME) {
      if (!channel) {
        return reply(translate('music_play.go_join_a_voice_channel'));
      }
      if (!channel.canJoin || !channel.canSpeak) {
        return reply(translate('music_play.cannot_join_ur_channel'));
      }
    }
    await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    const music = await fetchGuildMusic(context, guildId).catch(() => null);
    if (!music || !music.current || music.held_position === null) {
      return followUp(translate('music.nothing_playing'));
    }
    switch (control) {
      case MusicControls.RESTART: {
        await editGuildMusicSession(context, guildId, {position: 0});
      }; break;
      case MusicControls.RESUME: {
        // it carries on like `music play` would
        if (!await VoiceNode.resumeHeld(context, context.client, guildId, channel!.id)) {
          return followUp(translate('music.nothing_playing'));
        }
      }; break;
      case MusicControls.SKIP: {
        // the next one is held from the start (a link still converting stays queued, nothing's held then)
        await postGuildMusicNext(context, guildId, {finishedId: music.current.id, finishedReason: 'skipped'});
      }; break;
    }
    return showMusicControlsMessage(context, translator, guildId, itemId, undefined, rerender);
  }

  if (playback.includes(control)) {
    if (!guild || (!VoiceNode.isPlaying(guildId) && !guild.disconnected)) {
      return reply(translate('music.nothing_playing'));
    }
    if (guild.disconnected) {
      // nothing to skip or restart without voice (it's paused already), only resuming carries on
      if (control !== MusicControls.RESUME && control !== MusicControls.PAUSE) {
        return reply(translate('music.nothing_playing'));
      }
      if (!channel) {
        return reply(translate('music_play.go_join_a_voice_channel'));
      }
      if (!channel.canJoin || !channel.canSpeak) {
        return reply(translate('music_play.cannot_join_ur_channel'));
      }
    } else if (!channel || channel.id !== guild.channelId) {
      return reply(translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`}));
    }
  }

  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);

  let done = false;
  let paused: boolean | undefined;
  switch (control) {
    case MusicControls.PLAY_NEXT: {
      const music = await fetchGuildMusic(context, guildId).catch(() => null);
      const item = (music && itemId) ? music.queue.find((x) => x.id === itemId) : undefined;
      if (!item) {
        return followUp(translate('music_controls.not_queued'));
      }
      if (item.user_id !== context.userId && !canManageMusic(context.member)) {
        return followUp(translate('music_controls.not_yours'));
      }
      await editGuildMusicQueueItem(context, guildId, item.id, {position: 1});
      done = true;
    }; break;
    case MusicControls.REFRESH: {
      done = true;
    }; break;
    case MusicControls.RESTART: {
      done = !!await VoiceNode.seek(guildId, 0);
    }; break;
    case MusicControls.SKIP: {
      // the message shows what comes next, so it waits for it to start (or for us to leave, the queue ran out)
      const next = VoiceNode.waitForNextTrack(guildId);
      done = await VoiceNode.skip(guildId);
      if (done) {
        await next;
      }
    }; break;
    case MusicControls.PAUSE: {
      // disconnected, it's held paused already (the page just shows it)
      done = guild!.disconnected || !!await VoiceNode.setPaused(guildId, true);
    }; break;
    case MusicControls.RESUME: {
      if (guild!.disconnected) {
        // like `music resume`, the held track carries on in their channel
        const player = await VoiceNode.getPlayer(guildId);
        done = !!player && !!player.track && VoiceNode.reconnect(guildId, channel!.id);
        paused = (done) ? false : undefined;
      } else {
        done = !!await VoiceNode.setPaused(guildId, false);
      }
    }; break;
  }
  if (!done) {
    return followUp(translate('music.nothing_playing'));
  }
  return showMusicControlsMessage(context, translator, guildId, itemId, paused, rerender);
}


// the message a control was clicked on, shown again after it did its thing. `paused` for when the guild's state doesn't
// show it yet
async function showMusicControlsMessage(
  context: ComponentContext,
  translator: Pick<Translator, 'language' | 'translate'>,
  guildId: string,
  itemId?: string,
  paused?: boolean,
  rerender?: (context: ComponentContext) => Promise<any>,
) {
  const message = context.interaction.message;
  if (!message) {
    return;
  }
  if (rerender) {
    return rerender(context);
  }
  // `music info`'s and `music play`'s pages: the track's page is rendered again (it moved, or the queue went on), so the
  // paginator keeps handling its own buttons
  const stored = PaginatorsStore.get(message.channelId);
  const paginator = (stored) ? [...stored.normal, ...stored.ephemeral].find((x) => x.messageId === message.id) : undefined;
  if (paginator && !paginator.stopped) {
    const page = (itemId) ? await createMusicPage(context, translator, guildId, {itemId, page: paginator.page}) : null;
    if (page) {
      paginator.page = page.page;
    }
    return paginator.renderPage(context);
  }
  // the pages stopped (they expire, a single page never had any, or a reply from before them): the track's page goes
  // in their place, an album's/playlist's remove button stays until it's used and a prefixed command's invoker stays
  const page = await createMusicPage(context, translator, guildId, {batchId: findMusicBatchId(message), itemId, paused});
  if (page) {
    const invokerId = await findCommandInvokerId(context, message);
    return displayReply(context, {...page.display, componentsInside: true}, {invokerId: invokerId || undefined});
  }
  // nothing's playing or queued anymore (skipped the last one), the message says so
  const invokerId = await findCommandInvokerId(context, message);
  return displayReply(context, {description: translator.translate('music.nothing_playing')}, {invokerId: invokerId || undefined});
}


// who used the prefixed command a reply answers (the message it replies to), null for a slash command's reply (discord
// shows who used it already)
export async function findCommandInvokerId(context: ComponentContext, message: Structures.Message): Promise<null | string> {
  if (message.interactionMetadata || message.interaction) {
    return null;
  }
  if (message.referencedMessage) {
    return message.referencedMessage.author.id;
  }
  const reference = message.messageReference;
  if (!reference || !reference.messageId) {
    return null;
  }
  try {
    const raw = await context.rest.fetchMessage(message.channelId, reference.messageId);
    return (raw && raw.author) ? raw.author.id : null;
  } catch(error) {
    // deleted, the line's left out
    return null;
  }
}


// the batch id of an album's/playlist's remove button on the message that hasn't been used yet
function findMusicBatchId(message: Structures.Message): null | string {
  const prefix = MessageComponentCustomIds.MUSIC_BATCH + '.';
  let batchId: null | string = null;
  const find = (value: any) => {
    if (Array.isArray(value)) {
      return value.forEach(find);
    }
    if (!value || typeof(value) !== 'object') {
      return;
    }
    if (typeof(value.custom_id) === 'string' && value.custom_id.startsWith(prefix) && !value.disabled) {
      batchId = value.custom_id.slice(prefix.length);
    }
    find(value.components);
  };
  find(JSON.parse(JSON.stringify(message.components)));
  return batchId;
}


// the message's components as raw json with the row of buttons whose custom ids start with `prefix` swapped for
// `replacement`'s, null when it has none. The rest goes back as it was (`JSON.stringify` goes through every
// structure's `toJSON`), without the extra fields discord sends on emojis and media. Wrapped in a `toJSON` so the
// rest client sends it as is, a plain array gets each component read as camelCase (losing `custom_id` and the edit)
function replaceComponentsRow(message: Structures.Message, prefix: string, replacement: Components): any {
  const row = JSON.parse(JSON.stringify(replacement.components[0]));
  let replaced = false;

  const copy = (value: any): any => {
    if (Array.isArray(value)) {
      return value.map(copy);
    }
    if (!value || typeof(value) !== 'object') {
      return value;
    }
    if (
      value.type === MessageComponentTypes.ACTION_ROW &&
      Array.isArray(value.components) &&
      value.components.some((x: any) => typeof(x.custom_id) === 'string' && x.custom_id.startsWith(prefix + '.'))
    ) {
      replaced = true;
      return row;
    }
    const raw: Record<string, any> = {};
    for (let key in value) {
      const x = value[key];
      switch (key) {
        case 'emoji': raw[key] = (x) ? {animated: x.animated, id: x.id, name: x.name} : x; break;
        case 'file':
        case 'media': raw[key] = (x) ? {url: x.url} : x; break;
        default: raw[key] = copy(x);
      }
    }
    return raw;
  };

  const components = copy(JSON.parse(JSON.stringify(message.components)));
  return (replaced) ? {toJSON: () => components} : null;
}
