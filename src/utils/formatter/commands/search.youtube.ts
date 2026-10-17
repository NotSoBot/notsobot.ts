import * as moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchYoutube } from '../../../api';
import { getTranslator } from '../../i18n';
import {
  CommandCategories,
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  MOMENT_FORMAT,
  YoutubeResultTypes,
} from '../../../constants';
import { DisplayPayload, Paginator, displayReply } from '../../../utils';



export const COMMAND_ID = 'search.youtube';

export interface CommandArgs {
  query: string,
  sp?: string,
}

// links in the description get wrapped in <> so text responses don't preview them over the thumbnail,
// the rest is escaped (escaping a link would break it)
const DESCRIPTION_LINK_REGEX = /https?:\/\/[^\s<>]+/g;
const DESCRIPTION_LINK_TRAILING = '.,!?;:\'"';

function escapeDescription(text: string): string {
  let escaped = '';
  let last = 0;
  for (let match of text.matchAll(DESCRIPTION_LINK_REGEX)) {
    let url = match[0];
    // punctuation after a link belongs to the sentence, a closing paren only to the link if the link opened it
    while (url.length) {
      const character = url[url.length - 1];
      if (DESCRIPTION_LINK_TRAILING.includes(character) || (character === ')' && url.split(')').length > url.split('(').length)) {
        url = url.slice(0, -1);
      } else {
        break;
      }
    }
    const index = match.index!;
    escaped += Markup.escape.all(text.slice(last, index), {limit: 0}) + `<${url}>`;
    last = index + url.length;
  }
  return escaped + Markup.escape.all(text.slice(last), {limit: 0});
}

function formatChannel(channel: {name: string, url: string}): string {
  const name = Markup.escape.all(channel.name);
  return (channel.url) ? Markup.url(name, `<${channel.url}>`) : name;
}


export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { results, total_result_count: totalResultCount } = await searchYoutube(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const result = results[page - 1];

        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;
        payload.footer = translate('search_youtube.page_of_youtube_search_results_total_results', {page: page, pageLimit: pageLimit, totalResultCount: totalResultCount.toLocaleString(language)});
        payload.footerIconUrl = EmbedBrands.YOUTUBE;

        payload.title = result.title;
        payload.url = result.url;
        if (result.thumbnail) {
          payload.image = result.thumbnail.url;
        }

        // who made it, then the stats on one line, the id and badges in small text, then the description quoted
        const description: Array<string> = [];
        const details: Array<string> = [];
        const extra: Array<string> = [];
        switch (result.type) {
          case YoutubeResultTypes.CHANNEL: {
            const channel = result.metadata;

            if (channel.is_show) {
              extra.push(translate('search_youtube.is_show'));
            } else {
              details.push(translate('search_youtube.subscribers', {subscriber_count: channel.subscriber_count.toLocaleString(language)}));
            }
            if (channel.video_count !== -1) {
              details.push(translate('search_youtube.videos', {video_count: channel.video_count.toLocaleString(language)}));
            }
            if (channel.badges.length) {
              extra.push(translate('search_youtube.badges', {badges: channel.badges.join(', ')}));
            }
            extra.push(translate('search_youtube.id', {channel: Markup.codestring(channel.id)}));
          }; break;
          case YoutubeResultTypes.MOVIE: {
            const movie = result.metadata;

            description.push(translate('search_youtube.uploaded_by', {name: formatChannel(movie.channel)}));

            const duration = moment.duration(movie.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
            details.push(translate('search_youtube.duration', {duration: duration}));
            details.push(translate('search_youtube.genre', {genre: movie.genre}));
            details.push(Markup.url(movie.price, `<${result.url}>`));
            extra.push(translate('search_youtube.id_2', {movie: Markup.codestring(movie.id)}));

            for (let field of movie.fields) {
              payload.fields!.push({inline: true, name: Markup.escape.all(field.name), value: Markup.escape.all(field.value)});
            }
          }; break;
          case YoutubeResultTypes.PLAYLIST: {
            const playlist = result.metadata;

            description.push(translate('search_youtube.created_by', {name: formatChannel(playlist.channel)}));

            details.push(translate('search_youtube.videos', {video_count: playlist.video_count.toLocaleString(language)}));
            if (playlist.updated) {
              details.push(translate('search_youtube.updated', {updated: playlist.updated}));
            }
            extra.push(translate('search_youtube.id_3', {playlist: Markup.codestring(playlist.id)}));

            if (playlist.videos.length) {
              const videos: Array<string> = [];
              for (let video of playlist.videos) {
                const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
                videos.push(`${Markup.url(Markup.escape.all(video.title), `<${video.url}>`)} · ${duration}`);
              }
              videos.push(Markup.url(`View all ${playlist.video_count.toLocaleString(language)} videos`, `<${result.url}>`));
              payload.fields!.push({name: translate('search_youtube.playlist_videos'), value: videos.join('\n')});
            }
          }; break;
          case YoutubeResultTypes.VIDEO: {
            const video = result.metadata;
            const isLive = video.badges.includes('LIVE NOW');

            description.push(translate('search_youtube.uploaded_by', {name: formatChannel(video.channel)}));

            if (video.duration) {
              const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
              details.push(translate('search_youtube.duration', {duration: duration}));
            } else if (isLive) {
              details.push(translate('search_youtube.duration_currently_live'));
            }

            const viewCount = (video.view_count === null) ? 'None' : video.view_count.toLocaleString(language);
            if (isLive) {
              details.push(translate('search_youtube.viewers', {viewCount: viewCount}));
            } else {
              details.push(translate('search_youtube.views', {viewCount: viewCount}));
            }
            if (video.published) {
              if (video.streamed) {
                details.push(translate('search_youtube.streamed', {published: video.published}));
              } else {
                details.push(translate('search_youtube.published', {published: video.published}));
              }
            }

            if (video.badges.length) {
              extra.push(translate('search_youtube.badges', {badges: video.badges.join(', ')}));
            }
            extra.push(translate('search_youtube.id_4', {video: Markup.codestring(video.id)}));
          }; break;
        }

        if (details.length) {
          description.push(details.join(' · '));
        }
        if (extra.length) {
          description.push(`-# ${extra.join(' · ')}`);
        }
        if (result.description) {
          description.push(escapeDescription(result.description).split('\n').map((line) => `> ${line}`).join('\n'));
        }
        payload.description = description.join('\n');

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_youtube.couldn_t_find_any_videos_for_that')});
}
