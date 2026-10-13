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

        if (result.description) {
          payload.description = Markup.escape.all(result.description);
        }
        if (result.thumbnail) {
          payload.image = result.thumbnail.url;
        }

        switch (result.type) {
          case YoutubeResultTypes.CHANNEL: {
            const channel = result.metadata;

            const description: Array<string> = [];
            if (channel.is_show) {
              description.push(translate('search_youtube.is_show'));
              description.push('');
            }

            if (channel.badges.length) {
              description.push(translate('search_youtube.badges', {badges: channel.badges.join(', ')}));
            }
            description.push(translate('search_youtube.id', {channel: Markup.codestring(channel.id)}));
            if (!channel.is_show) {
              description.push(translate('search_youtube.subscribers', {subscriber_count: channel.subscriber_count.toLocaleString(language)}));
            }
            if (channel.video_count !== -1) {
              description.push(translate('search_youtube.videos', {video_count: channel.video_count.toLocaleString(language)}));
            }

            payload.fields!.push({name: translate('search_youtube.channel_information'), value: description.join('\n')});
          }; break;
          case YoutubeResultTypes.MOVIE: {
            const movie = result.metadata;

            const description: Array<string> = [];
            if (movie.channel.url) {
              description.push(translate('search_youtube.uploaded_by', {name: Markup.url(Markup.escape.all(movie.channel.name), movie.channel.url)}));
            } else {
              description.push(translate('search_youtube.uploaded_by', {name: Markup.escape.all(movie.channel.name)}));
            }

            const duration = moment.duration(movie.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
            description.push(translate('search_youtube.duration', {duration: duration}));
            description.push(translate('search_youtube.genre', {genre: movie.genre}));
            description.push(translate('search_youtube.id_2', {movie: Markup.codestring(movie.id)}));
            description.push(`${Markup.url(movie.price, result.url)}`);

            payload.fields!.push({name: translate('search_youtube.movie_information'), value: description.join('\n')});

            for (let field of movie.fields) {
              payload.fields!.push({inline: true, name: Markup.escape.all(field.name), value: Markup.escape.all(field.value)});
            }
          }; break;
          case YoutubeResultTypes.PLAYLIST: {
            const playlist = result.metadata;

            const description: Array<string> = [];
            if (playlist.channel.url) {
              description.push(translate('search_youtube.created_by', {name: Markup.url(Markup.escape.all(playlist.channel.name), playlist.channel.url)}));
            } else {
              description.push(translate('search_youtube.created_by', {name: Markup.escape.all(playlist.channel.name)}));
            }

            description.push(translate('search_youtube.id_3', {playlist: Markup.codestring(playlist.id)}));
            if (playlist.updated) {
              description.push(translate('search_youtube.updated', {updated: playlist.updated}));
            }
            description.push(translate('search_youtube.videos', {video_count: playlist.video_count.toLocaleString(language)}));

            payload.fields!.push({name: translate('search_youtube.playlist_information'), value: description.join('\n')});

            const videos: Array<string> = [];
            for (let video of playlist.videos) {
              const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
              videos.push(Markup.url(Markup.escape.all(video.title), video.url));
              videos.push(`-> ${duration}`);
            }
            videos.push('');
            videos.push(Markup.url(`View all ${playlist.video_count.toLocaleString()} videos`, result.url));
            payload.fields!.push({name: translate('search_youtube.playlist_videos'), value: videos.join('\n')});
          }; break;
          case YoutubeResultTypes.VIDEO: {
            const video = result.metadata;
            const isLive = video.badges.includes('LIVE NOW');

            const description: Array<string> = [];
            if (video.channel.url) {
              description.push(translate('search_youtube.uploaded_by', {name: Markup.url(Markup.escape.all(video.channel.name), video.channel.url)}));
            } else {
              description.push(translate('search_youtube.uploaded_by', {name: Markup.escape.all(video.channel.name)}));
            }

            if (video.badges.length) {
              description.push(translate('search_youtube.badges', {badges: video.badges.join(', ')}));
            }
            if (video.duration) {
              const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
              description.push(translate('search_youtube.duration', {duration: duration}));
            } else {
              if (isLive) {
                description.push(translate('search_youtube.duration_currently_live'));
              }
            }
            description.push(translate('search_youtube.id_4', {video: Markup.codestring(video.id)}));
            if (video.published) {
              if (video.streamed) {
                description.push(translate('search_youtube.streamed', {published: video.published}));
              } else {
                description.push(translate('search_youtube.published', {published: video.published}));
              }
            }

            let viewCount = (video.view_count === null) ? 'None' : video.view_count.toLocaleString();
            if (isLive) {
              description.push(translate('search_youtube.viewers', {viewCount: viewCount}));
            } else {
              description.push(translate('search_youtube.views', {viewCount: viewCount}));
            }

            payload.fields!.push({name: translate('search_youtube.video_information'), value: description.join('\n')});
          }; break;
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_youtube.couldn_t_find_any_videos_for_that')});
}
