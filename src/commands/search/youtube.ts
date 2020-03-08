import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';
const { Markup } = Utils;

import { youtubeSearch } from '../../api';
import {
  CommandTypes,
  DateMomentOptions,
  EmbedBrands,
  EmbedColors,
  YoutubeResultTypes,
  MOMENT_FORMAT,
} from '../../constants';
import { Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
}

export interface CommandArgs {
  query: string,
}

export default class YoutubeCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['yt'];
  name = 'youtube';

  metadata = {
    description: 'Search Youtube',
    examples: [
      'youtube notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'youtube <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

    const { results, total_result_count: totalResultCount } = await youtubeSearch(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const result = results[page - 1];

          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setFooter(`Page ${page}/${pageLimit} of Youtube Search Results (${totalResultCount.toLocaleString()} Total Results)`, EmbedBrands.YOUTUBE);

          embed.setTitle(result.title);
          embed.setUrl(result.url);

          if (result.description) {
            embed.setDescription(Markup.escape.all(result.description));
          }
          if (result.thumbnail) {
            embed.setThumbnail(result.thumbnail.url);
          }

          switch (result.type) {
            case YoutubeResultTypes.CHANNEL: {
              const channel = result.metadata;

              const description: Array<string> = [];
              if (channel.badges.length) {
                description.push(`**Badges**: ${channel.badges.join(', ')}`);
              }
              description.push(`**Id**: ${channel.id}`);
              description.push(`**Subscribers**: ${channel.subscriber_count}`);
              description.push(`**Videos**: ${channel.video_count.toLocaleString()}`);

              embed.addField('Channel Information', description.join('\n'));
            }; break;
            case YoutubeResultTypes.MOVIE: {
              const movie = result.metadata;

              const description: Array<string> = [];
              description.push(`Uploaded by ${Markup.url(Markup.escape.all(movie.channel.name), movie.channel.url)}`);

              const duration = moment.duration(movie.duration).format(MOMENT_FORMAT, DateMomentOptions);
              description.push(`**Duration**: ${duration}`);
              description.push(`**Genre**: ${movie.genre}`);
              description.push(`**Id**: ${movie.id}`);
              description.push(`${Markup.url(movie.price, result.url)}`);

              embed.addField('Movie Information', description.join('\n'));

              for (let field of movie.fields) {
                embed.addField(Markup.escape.all(field.name), Markup.escape.all(field.value), true);
              }
            }; break;
            case YoutubeResultTypes.VIDEO: {
              const video = result.metadata;
              const isLive = video.badges.includes('LIVE NOW');

              const description: Array<string> = [];
              description.push(`Uploaded by ${Markup.url(Markup.escape.all(video.channel.name), video.channel.url)}`);

              if (video.badges.length) {
                description.push(`**Badges**: ${video.badges.join(', ')}`);
              }
              if (video.duration) {
                const duration = moment.duration(video.duration).format(MOMENT_FORMAT, DateMomentOptions);
                description.push(`**Duration**: ${duration}`);
              } else {
                if (isLive) {
                  description.push(`**Duration**: Currently Live`);
                }
              }
              description.push(`**Id**: ${video.id}`);
              if (video.published) {
                description.push(`**Published**: ${video.published}`);
              }
              if (isLive) {
                description.push(`**Viewers**: ${video.view_count.toLocaleString()}`);
              } else {
                description.push(`**Views**: ${video.view_count.toLocaleString()}`);
              }

              embed.addField('Video Information', description.join('\n'));
            }; break;
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any videos for that search term');
    }
  }
}
