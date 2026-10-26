import { Structures } from 'detritus-client';
import { InteractionCallbackTypes, MessageComponentButtonStyles, MessageFlags } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import {
  editGuildMusicQueueItem,
  fetchGuildMusic,
  postGuildMusicNext,
} from '../../../api';
import { RequestContext } from '../../../api/raw';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, MessageComponentCustomIds } from '../../../constants';
import PaginatorsStore from '../../../stores/paginators';
import { DisplayPayload, Paginator, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { Translator, getCachedTranslator } from '../../i18n';

import {
  MusicVoteKinds,
  canManageMusic,
  canManageOthersMusic,
  clearMusicVotes,
  canControlMusicItem,
  musicDjRefusal,
  musicEffectNames,
  musicItemBatchText,
  musicItemDisplayTitle,
  musicItemLinks,
  musicItemQueuedAt,
  musicItemTitle,
  musicKnownEffects,
  musicLoopText,
  musicNothingPlayingText,
  musicNowPlaying,
  musicPlayerPosition,
  musicVote,
} from './music.shared';
import { replayMusic } from './music.replay';


export enum MusicControls {
  // a queued track goes next (theirs, or anyone's with manage server or the dj role)
  PLAY_NEXT = 'next',
  // a queued track plays now: it goes next and what's playing is skipped (skipping it without a vote, see `PLAY_NOW`'s
  // case in `onMusicControl`)
  PLAY_NOW = 'now',
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
  // a queued track while something's playing (or held)
  playNow?: boolean,
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
  if (options.playNow && options.itemId) {
    components.createButton({
      customId: customId(MusicControls.PLAY_NOW),
      label: translate('music_controls.play_now'),
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
  // the live effects it plays with (`music effect`), in the order they were picked
  const effects = musicKnownEffects(player && player.effects);
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
    // the progress bar, where it's playing (`playing in #channel • 90ms ping`) with its effects under it, then who
    // requested it
    description = displayDetails([
      musicNowPlaying(item, progress, fetchedAt, [
        [
          // held or disconnected, it's only paused until someone resumes it in their channel
          (held) ? translate('music_info.not_in_voice') : null,
          (guild && guild.channelId && !guild.disconnected) ? translate('music_info.playing_in', {channel: `<#${guild.channelId}>`}) : null,
          (player && connected && 0 <= player.ping) ? translate('music_info.ping', {ping: player.ping}) : null,
          (guild && !connected && !guild.disconnected) ? translate('music_info.connecting') : null,
        ],
        // its live effects on their own line (`fx Nightcore + Bass Boost`)
        [(effects.length) ? translate('music_info.effects', {effects: musicEffectNames(effects)}) : null],
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

  const components = createMusicControls(translate, guildId, {
    itemId: item.id,
    paused,
    playNext: 1 < index,
    playNow: !playing && !!music.current,
    queued: !playing,
    refresh: false,
  });

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



// pausing/resuming and skipping need you in the music's channel (anyone while we're disconnected, resuming joins their
// channel). Held music (we left, paused too long) is like a stopped player: play joins (their channel), skip moves where
// it's held. Restart is `music replay` (back to the start, playing or paused as it was). Skipping, pausing and resuming are
// votes (`musicVote`), anyone can refresh, play next is for your own tracks (or anyone's with manage server or the
// dj role). `itemId` is the track the page was about, the page that shows it now is
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
  const playback = [MusicControls.PAUSE, MusicControls.RESUME, MusicControls.SKIP] as Array<string>;

  // dj mode: only djs use the playback buttons (and play next), the setting's only fetched for everyone else
  const djControls = [...playback, MusicControls.RESTART, MusicControls.PLAY_NEXT, MusicControls.PLAY_NOW] as Array<string>;
  if (djControls.includes(control) && !canManageMusic(member)) {
    const refusal = musicDjRefusal(translate, member, await fetchGuildMusic(context, guildId).catch(() => null));
    if (refusal) {
      return reply(refusal);
    }
  }

  // back to the start, playing or paused as it was (`music replay` does the same)
  if (control === MusicControls.RESTART) {
    await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
    const { done, message } = await replayMusic(context, translate, guildId, member);
    if (!done) {
      return followUp(message);
    }
    return showMusicControlsMessage(context, translator, guildId, itemId, undefined, rerender);
  }

  if (control === MusicControls.PLAY_NOW) {
    return playMusicNow(context, translator, guildId, itemId, rerender);
  }

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
      if (item.user_id !== context.userId && !canManageOthersMusic(context.member, music)) {
        return followUp(translate('music_controls.not_yours'));
      }
      await editGuildMusicQueueItem(context, guildId, item.id, {position: 1});
      done = true;
    }; break;
    case MusicControls.REFRESH: {
      done = true;
    }; break;
    case MusicControls.SKIP: {
      // a vote like `music skip`, it only says how many voted until enough did
      const music = await fetchGuildMusic(context, guildId).catch(() => null);
      if (!music || !music.current) {
        return followUp(translate('music.nothing_playing'));
      }
      const vote = musicVote(MusicVoteKinds.SKIP, member!, channel!, music.current, music.vote_skip);
      if (!vote.done) {
        return followUp(translate('music_skip.voted', {title: musicItemTitle(music.current), votes: `${vote.votes}/${vote.needed}`}));
      }
      // the message shows what comes next, so it waits for it to start (or for us to leave, the queue ran out)
      const next = VoiceNode.waitForNextTrack(guildId);
      done = await VoiceNode.skip(guildId);
      if (done) {
        await next;
      }
    }; break;
    case MusicControls.PAUSE: {
      // disconnected, it's held paused already (the page just shows it)
      if (guild!.disconnected) {
        done = true;
        break;
      }
      // a vote like `music pause`, it only says how many voted until enough did
      const music = await fetchGuildMusic(context, guildId).catch(() => null);
      if (music && music.current) {
        const vote = musicVote(MusicVoteKinds.PAUSE, member!, channel!, music.current, music.vote_pause);
        if (!vote.done) {
          return followUp(translate('music_pause.voted', {title: musicItemTitle(music.current), votes: `${vote.votes}/${vote.needed}`}));
        }
      }
      done = !!await VoiceNode.setPaused(guildId, true);
      if (done) {
        clearMusicVotes(MusicVoteKinds.RESUME, guildId);
      }
    }; break;
    case MusicControls.RESUME: {
      if (guild!.disconnected) {
        // like `music resume`, the held track carries on in their channel
        const player = await VoiceNode.getPlayer(guildId);
        done = !!player && !!player.track && VoiceNode.reconnect(guildId, channel!.id);
        paused = (done) ? false : undefined;
      } else {
        // a vote like `music resume` while it's paused, it only says how many voted until enough did
        const music = (guild!.paused) ? await fetchGuildMusic(context, guildId).catch(() => null) : null;
        if (music && music.current) {
          const vote = musicVote(MusicVoteKinds.RESUME, member!, channel!, music.current, music.vote_resume);
          if (!vote.done) {
            return followUp(translate('music_resume.voted', {title: musicItemTitle(music.current), votes: `${vote.votes}/${vote.needed}`}));
          }
        }
        done = !!await VoiceNode.setPaused(guildId, false);
        if (done) {
          clearMusicVotes(MusicVoteKinds.PAUSE, guildId);
        }
      }
    }; break;
  }
  if (!done) {
    return followUp(translate('music.nothing_playing'));
  }
  return showMusicControlsMessage(context, translator, guildId, itemId, paused, rerender);
}


// `PLAY_NOW`: the queued track goes next and what's playing is skipped, so it's yours to move (or you manage the music)
// and what's playing has to be yours to skip right away (`canControlMusicItem`, no vote to start for it). Held music
// skips where it's held, it starts from the start once someone resumes
async function playMusicNow(
  context: ComponentContext,
  translator: Pick<Translator, 'language' | 'translate'>,
  guildId: string,
  itemId?: string,
  rerender?: (context: ComponentContext) => Promise<any>,
) {
  const { translate } = translator;
  const reply = (content: string) => {
    return context.respond(InteractionCallbackTypes.CHANNEL_MESSAGE_WITH_SOURCE, {content, flags: MessageFlags.EPHEMERAL});
  };
  const guild = VoiceNode.guilds.get(guildId);
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (guild) {
    // disconnected or joining, there's nothing to skip yet
    if (!VoiceNode.isPlaying(guildId)) {
      return reply(translate('music.nothing_playing'));
    }
    if (!member || !channel || channel.id !== guild.channelId) {
      return reply(translate('music_controls.join_my_channel', {channel: `<#${guild.channelId}>`}));
    }
  }

  const music = await fetchGuildMusic(context, guildId).catch(() => null);
  const item = (music && itemId) ? music.queue.find((x) => x.id === itemId) : undefined;
  if (!music || !item) {
    return reply(translate('music_controls.not_queued'));
  }
  if (item.user_id !== context.userId && !canManageOthersMusic(member, music)) {
    return reply(translate('music_controls.not_yours'));
  }
  const held = !guild && !!music.current && music.held_position !== null;
  if (!music.current || (!guild && !held)) {
    return reply(translate('music.nothing_playing'));
  }
  if (guild && !canControlMusicItem(member!, channel!, music.current, music.vote_skip)) {
    return reply(translate('music_controls.play_now_vote', {title: `**${musicItemTitle(music.current)}**`}));
  }

  await context.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
  if (item.position !== 1) {
    await editGuildMusicQueueItem(context, guildId, item.id, {position: 1});
  }
  if (held) {
    await postGuildMusicNext(context, guildId, {finishedId: music.current.id, finishedReason: 'skipped'});
  } else {
    // the page shows it playing, so it waits for it to start (a link still converting times out, it's next anyway)
    const next = VoiceNode.waitForNextTrack(guildId);
    if (await VoiceNode.skip(guildId)) {
      clearMusicVotes(MusicVoteKinds.SKIP, guildId);
      await next;
    }
  }
  return showMusicControlsMessage(context, translator, guildId, item.id, undefined, rerender);
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
  const paginator = findMessagePaginator(message);
  if (paginator) {
    const page = (itemId) ? await createMusicPage(context, translator, guildId, {itemId, page: paginator.page}) : null;
    if (page) {
      paginator.page = page.page;
    }
    return paginator.renderPage(context);
  }
  // the pages stopped (they expire, a single page never had any, or a reply from before them): the track's page goes
  // in their place, a prefixed command's invoker stays
  const page = await createMusicPage(context, translator, guildId, {itemId, paused});
  if (page) {
    const invokerId = await findCommandInvokerId(context, message);
    return displayReply(context, {...page.display, componentsInside: true}, {invokerId: invokerId || undefined});
  }
  // nothing's playing or queued anymore (skipped the last one), the message says so
  const invokerId = await findCommandInvokerId(context, message);
  return displayReply(context, {description: musicNothingPlayingText(translator.translate, guildId)}, {invokerId: invokerId || undefined});
}


// the pages still going on `message` (`music info`'s and `music play`'s), they handle its buttons
function findMessagePaginator(message: Structures.Message): Paginator | undefined {
  const stored = PaginatorsStore.get(message.channelId);
  const paginator = (stored) ? [...stored.normal, ...stored.ephemeral].find((x) => x.messageId === message.id) : undefined;
  return (paginator && !paginator.stopped) ? paginator : undefined;
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
