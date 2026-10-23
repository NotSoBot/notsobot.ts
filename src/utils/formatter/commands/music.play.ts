import { Command, Interaction } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { ComponentContext, Components, Markup } from 'detritus-client/lib/utils';

import { searchMusic } from '../../../api';
import { getApiError, getApiErrorTranslationKey } from '../../../api/errors';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordEmojis, StatusEmojis } from '../../../constants';
import { displayDetails, displayReply, formatTime } from '../../../utils';
import VoiceNode from '../../../voicenode';
import { getTranslator } from '../../i18n';

import { musicItemTitle } from './music.shared';


// a text search's results to pick from (a select menu fits 25), and how long they can be picked
const MAX_CHOICES = 10;
const PICK_TIMEOUT = 60 * 1000;

export const COMMAND_ID = 'music.play';

export interface CommandArgs {
  // text, a spotify/deezer/tidal/apple music/youtube music track link, or any other link (or the last media)
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const member = context.member;
  const channel = member && member.voiceState && member.voiceState.channel;
  if (!context.guildId || !channel) {
    return displayReply(context, {description: translate('music_play.go_join_a_voice_channel')});
  }
  if (!channel.canJoin || !channel.canSpeak) {
    return displayReply(context, {description: translate('music_play.cannot_join_ur_channel')});
  }
  const guildId = context.guildId;

  // a service link's track and a link are queued as they are, a text search's results are picked from
  const search = await searchMusic(context, args.query);
  if (!search.results.length) {
    return displayReply(context, {description: translate('music_play.no_results')});
  }

  const queue = async (result: RestResponsesRaw.MusicSearchResult) => {
    const { item, joined } = await VoiceNode.play(context, context.client, guildId, channel.id, result, context.userId);
    return displayDetails([
      `**${musicItemTitle(item)}**`,
      (joined) ?
        translate('music_play.now_playing', {channel: channel.mention}) :
        translate('music_play.added_to_queue', {position: item.position.toLocaleString(language)}),
    ]);
  };

  const results = search.results.slice(0, MAX_CHOICES);
  if (search.type !== 'search' || results.length === 1) {
    return displayReply(context, {description: await queue(results[0])});
  }

  const components = new Components({
    timeout: PICK_TIMEOUT,
    onTimeout: async () => {
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
      if (!result) {
        return ctx.respond(InteractionCallbackTypes.DEFERRED_UPDATE_MESSAGE);
      }

      // joining (connecting to a voice node) and queueing can take longer than discord's 3 seconds for answering a
      // pick, so it's answered right away (the menu goes) and the message is edited once it's queued
      await displayReply(context, {description: `**${Markup.escape.all(result.track!.title)}** ${DiscordEmojis.TYPING}`}, {replyTo: ctx});

      let description: string;
      try {
        description = await queue(result);
      } catch(error) {
        // the queue is full, there are no voice nodes, or the node can't be reached
        const apiError = await getApiError(error);
        if (apiError) {
          const key = getApiErrorTranslationKey(apiError.code);
          description = `${StatusEmojis.WARNING} ${(key) ? translateMaybe(key, apiError.message) : apiError.message}`;
        } else {
          description = `${StatusEmojis.WARNING} ${String(error.message || error)}`;
        }
      }
      await displayReply(context, {description}, {replyTo: ctx});
    },
  });

  return displayReply(context, {components, componentsInside: true, description: translate('music_play.pick_a_song')});
}
