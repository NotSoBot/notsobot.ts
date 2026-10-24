import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { fetchGuildMusic, searchMusic } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, StatusEmojis } from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { createMusicPaginator } from './music.info';
import { musicItemDisplayTitle, musicItemTitle, musicStayNote, musicStays } from './music.shared';


// a text search's results to pick from (a select menu fits 25), and how long they can be picked
const MAX_CHOICES = 10;
const PICK_TIMEOUT = 60 * 1000;
// how long a reply that joined waits for the first track to start (a link converts first), then it's shown again
const JOINED_START_TIMEOUT = 30 * 1000;

export const COMMAND_ID = 'music.play';

interface Queued {
  failed: Promise<DisplayPayload>,
  item: RestResponsesRaw.GuildMusicQueueItem,
  // above its page the first time (a held track carrying on first, an album's/playlist's name and how many were added)
  note: null | string,
  // we just joined to play it: the first track starting (or us leaving), the reply said `Connecting` until then
  started: null | Promise<unknown>,
}

export interface CommandArgs {
  // text, a spotify/deezer/tidal/apple music/youtube music track link, or any other link (or the last media)
  query: string,
}

// their voice channel, or why we can't play in it (`tts play` checks before making the speech)
export function findVoiceChannel(context: Command.Context | Interaction.InteractionContext) {
  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (!context.guildId || !channel) {
    return {channel: null, error: 'music_play.go_join_a_voice_channel'} as const;
  }
  if (!channel.canJoin || !channel.canSpeak) {
    return {channel: null, error: 'music_play.cannot_join_ur_channel'} as const;
  }
  return {channel, error: null} as const;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { channel, error } = findVoiceChannel(context);
  if (!channel) {
    return displayReply(context, {description: translate(error)});
  }
  const guildId = channel.guildId;

  // a service link's track and a link are queued as they are, a text search's results are picked from
  const search = await searchMusic(context, args.query);
  if (!search.results.length) {
    return displayReply(context, {description: translate('music_play.no_results')});
  }

  // queues it. `failed` is the node's error if it can't play it later (a link that won't convert, a track opus.rip
  // doesn't have anymore)
  const queue = async (result: RestResponsesRaw.MusicSearchResult): Promise<Queued> => {
    const { item, joined, resumed } = await VoiceNode.play(context, context.client, guildId, channel.id, result, context.userId);
    const started = (joined) ? VoiceNode.waitForNextTrack(guildId, JOINED_START_TIMEOUT) : null;
    // we just joined a 24/7 server: we'll stay, said once a join
    const stays = joined && musicStays(await fetchGuildMusic(context, guildId).catch(() => null));
    const note = displayDetails([resumedNote(resumed), (stays) ? musicStayNote(translate) : null]) || null;
    return {failed: trackFailed(item), item, note, started};
  };

  // right away, the node can fail it before we reply (it's shown once we have)
  const trackFailed = (item: RestResponsesRaw.GuildMusicQueueItem): Promise<DisplayPayload> => {
    return new Promise<DisplayPayload>((resolve) => {
      VoiceNode.onTrackError(guildId, item.id, (error) => {
        resolve({...musicItemDisplayTitle(item), description: `${StatusEmojis.WARNING} ${error}`});
      });
    });
  };

  // the track that was paused too long (or kept by `music leave`) carries on first: `Resuming artist - title from 1:23`
  const resumedNote = (resumed: null | {item: RestResponsesRaw.GuildMusicQueueItem, position: number}): null | string => {
    if (!resumed) {
      return null;
    }
    return translate('music_play.resuming', {position: Markup.codestring(formatTime(resumed.position)), title: musicItemTitle(resumed.item)});
  };

  // the queue's pages like `music info`, starting at the track's (`Added to Queue #3` until it plays). The reply becomes
  // the error if the node can't play it (it can be too old to edit by then, or the trigger's gone)
  const replyQueued = async (queued: Queued, batchId?: string) => {
    const paginator = await createMusicPaginator(context, guildId, {
      addedItemId: queued.item.id,
      batchId,
      itemId: queued.item.id,
      note: queued.note,
    });
    if (!paginator) {
      // played through or removed already
      return displayReply(context, {...musicItemDisplayTitle(queued.item), note: queued.note});
    }
    const reply = await paginator.start();
    let failed = false;
    queued.failed.then((payload) => {
      failed = true;
      paginator.stop(false);
      return displayReply(context, payload);
    }).catch(() => {});
    // we just joined: it said `Connecting`, shown again once it's playing (or we left, it couldn't)
    if (queued.started) {
      queued.started.then(() => {
        if (!failed && !paginator.stopped) {
          return paginator.renderPage();
        }
      }).catch(() => {});
    }
    return reply;
  };

  // an album's/playlist's tracks opus.rip has (the first 50), as many as fit in the queue (premium servers only). They can be removed together,
  // the pages start at its first track
  if (search.type === 'collection') {
    // a premium server perk, said before we join for it (the api checks too)
    const music = await fetchGuildMusic(context, guildId);
    if (!music.premium) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_play.collection_premium')}`});
    }
    const name = (search.collection) ? search.collection.name : null;
    const { batch, joined, resumed } = await VoiceNode.play(context, context.client, guildId, channel.id, search.results, context.userId, name);
    const started = (joined) ? VoiceNode.waitForNextTrack(guildId, JOINED_START_TIMEOUT) : null;
    const added = batch!.items;
    const total = (search.collection) ? search.collection.total : search.results.length;
    const duration = added.reduce((total, x) => total + ((x.track) ? x.track.duration : 0), 0);

    // why some were left out: the queue's full, or the server's queue rules (too long, already queued)
    let limit: null | string = null;
    if (batch!.limit === 'server') {
      limit = translate('music_play.limit_server');
    } else if (batch!.ruled_out) {
      limit = translate('music_play.limit_rules');
    }
    // `Album • Added 12 of 50 tracks • 45:00`
    const note = displayDetails([
      displayDetailsLine([
        `**${Markup.escape.all(name || translate('music_play.collection'))}**`,
        (added.length < total) ?
          translate('music_play.added_tracks_of', {count: added.length.toLocaleString(language), total: total.toLocaleString(language)}) :
          translate('music_play.added_tracks', {count: added.length.toLocaleString(language)}),
        (duration) ? Markup.codestring(formatTime(duration)) : null,
        limit,
      ]),
      resumedNote(resumed),
      // we just joined a 24/7 server: we'll stay
      (joined && musicStays(music)) ? musicStayNote(translate) : null,
    ]);
    return replyQueued({failed: trackFailed(added[0]), item: added[0], note, started}, batch!.batch_id);
  }

  const results = search.results.slice(0, MAX_CHOICES);
  if (search.type !== 'search' || results.length === 1) {
    return replyQueued(await queue(results[0]));
  }

  // once picked the reply is the queue's pages, the timeout leaves it alone
  let picked = false;
  const components = new Components({
    timeout: PICK_TIMEOUT,
    onTimeout: async () => {
      if (picked) {
        return;
      }
      try {
        await displayReply(context, {description: translate('music_play.pick_timed_out')});
      } catch(error) {

      }
    },
  });
  components.createSelectMenu({
    options: results.map((result, index) => {
      const track = result.track!;
      return {
        // select menu labels and descriptions are 100 characters at most
        description: [track.artist, formatTime(track.duration), track.album && track.album.name]
          .filter(Boolean).join(' • ').slice(0, 100),
        label: track.title.slice(0, 100),
        value: String(index),
      };
    }),
    placeholder: translate('music_play.pick_placeholder'),
    run: async (ctx: ComponentContext) => {
      if (ctx.userId !== context.userId) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      const result = results[parseInt((ctx.data.values || [])[0])];
      if (!result || picked) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }
      picked = true;

      // joining (connecting to a voice node) and queueing can take longer than discord's 3 seconds for answering a
      // pick, so it's answered right away (the menu goes) and the message is edited once it's queued
      await displayReply(context, {description: `**${Markup.escape.all(result.track!.title)}** ${DiscordEmojis.TYPING}`}, {replyTo: ctx});

      let queued: Awaited<ReturnType<typeof queue>>;
      try {
        queued = await queue(result);
      } catch(error) {
        // the queue is full, opus.rip doesn't have the track anymore, there are no voice nodes, or the node can't be reached
        const apiError = await getApiError(error);
        let description: string;
        if (apiError) {
          const key = getApiErrorTranslationKey(apiError.code);
          description = `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`;
        } else {
          description = `${StatusEmojis.WARNING} ${String(error.message || error)}`;
        }
        return displayReply(context, {description}, {replyTo: ctx});
      }
      // the pick already answered through `ctx`, the pages edit the same reply
      await replyQueued(queued);
    },
  });

  return displayReply(context, {components, componentsInside: true, description: translate('music_play.pick_a_song')});
}
