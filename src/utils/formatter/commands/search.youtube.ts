import * as moment from 'moment';

import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchYoutube } from '../../../api';
import {
  CommandCategories,
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  YoutubeResultTypes,
  MOMENT_FORMAT,
} from '../../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../../utils';



export const COMMAND_ID = 'search.youtube';

export interface CommandArgs {
  query: string,
  sp?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { results, total_result_count: totalResultCount } = await searchYoutube(context, args);
  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const result = results[page - 1];

        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);
        embed.setFooter(`Page ${page}/${pageLimit} of Youtube Search Results (${totalResultCount.toLocaleString()} Total Results)`, EmbedBrands.YOUTUBE);

        embed.setTitle(result.title);
        embed.setUrl(result.url);

        if (result.description) {
          embed.setDescription(Markup.escape.all(result.description));
        }
        if (result.thumbnail) {
          embed.setImage(result.thumbnail.url);
        }

        switch (result.type) {
          case YoutubeResultTypes.CHANNEL: {
            const channel = result.metadata;

            const description: Array<string> = [];
            if (channel.is_show) {
              description.push('Is Show');
              description.push('');
            }

            if (channel.badges.length) {
              description.push(`**Badges**: ${channel.badges.join(', ')}`);
            }
            description.push(`**Id**: ${channel.id}`);
            if (!channel.is_show) {
              description.push(`**Subscribers**: ${channel.subscriber_count.toLocaleString()}`);
            }
            if (channel.video_count !== -1) {
              description.push(`**Videos**: ${channel.video_count.toLocaleString()}`);
            }

            embed.addField('Channel Information', description.join('\n'));
          }; break;
          case YoutubeResultTypes.MOVIE: {
            const movie = result.metadata;

            const description: Array<string> = [];
            if (movie.channel.url) {
              description.push(`Uploaded by ${Markup.url(Markup.escape.all(movie.channel.name), movie.channel.url)}`);
            } else {
              description.push(`Uploaded by ${Markup.escape.all(movie.channel.name)}`);
            }

            const duration = moment.duration(movie.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
            description.push(`**Duration**: ${duration}`);
            description.push(`**Genre**: ${movie.genre}`);
            description.push(`**Id**: ${movie.id}`);
            description.push(`${Markup.url(movie.price, result.url)}`);

            embed.addField('Movie Information', description.join('\n'));

            for (let field of movie.fields) {
              embed.addField(Markup.escape.all(field.name), Markup.escape.all(field.value), true);
            }
          }; break;
          case YoutubeResultTypes.PLAYLIST: {
            const playlist = result.metadata;

            const description: Array<string> = [];
            if (playlist.channel.url) {
              description.push(`Created by ${Markup.url(Markup.escape.all(playlist.channel.name), playlist.channel.url)}`);
            } else {
              description.push(`Created by ${Markup.escape.all(playlist.channel.name)}`);
            }

            description.push(`**Id**: ${playlist.id}`);
            if (playlist.updated) {
              description.push(`**Updated**: ${playlist.updated}`);
            }
            description.push(`**Videos**: ${playlist.video_count.toLocaleString()}`);

            embed.addField('Playlist Information', description.join('\n'));

            const videos: Array<string> = [];
            for (let video of playlist.videos) {
              const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
              videos.push(Markup.url(Markup.escape.all(video.title), video.url));
              videos.push(`-> ${duration}`);
            }
            videos.push('');
            videos.push(Markup.url(`View all ${playlist.video_count.toLocaleString()} videos`, result.url));
            embed.addField('Playlist Videos', videos.join('\n'));
          }; break;
          case YoutubeResultTypes.VIDEO: {
            const video = result.metadata;
            const isLive = video.badges.includes('LIVE NOW');

            const description: Array<string> = [];
            if (video.channel.url) {
              description.push(`Uploaded by ${Markup.url(Markup.escape.all(video.channel.name), video.channel.url)}`);
            } else {
              description.push(`Uploaded by ${Markup.escape.all(video.channel.name)}`);
            }

            if (video.badges.length) {
              description.push(`**Badges**: ${video.badges.join(', ')}`);
            }
            if (video.duration) {
              const duration = moment.duration(video.duration, 'seconds').format(MOMENT_FORMAT, DateMomentOptions);
              description.push(`**Duration**: ${duration}`);
            } else {
              if (isLive) {
                description.push(`**Duration**: Currently Live`);
              }
            }
            description.push(`**Id**: ${video.id}`);
            if (video.published) {
              if (video.streamed) {
                description.push(`**Streamed**: ${video.published}`);
              } else {
                description.push(`**Published**: ${video.published}`);
              }
            }

            let viewCount = (video.view_count === null) ? 'None' : video.view_count.toLocaleString();
            if (isLive) {
              description.push(`**Viewers**: ${viewCount}`);
            } else {
              description.push(`**Views**: ${viewCount}`);
            }

            embed.addField('Video Information', description.join('\n'));
          }; break;
        }

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, 'Couldn\'t find any videos for that search term');
}
