import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { youtubeSearch } from '../api';
import { CommandTypes, EmbedBrands, EmbedColors, YoutubeResultTypes } from '../constants';
import { Paginator, onRunError, onTypeError } from '../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'youtube',
  aliases: ['yt'],
  label: 'query',
  metadata: {
    description: 'Search Youtube',
    examples: [
      'youtube notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'youtube <query>',
  },
  ratelimit: {
    duration: 5000,
    limit: 5,
    type: 'guild',
  },
  onBefore: (context) => {
    const channel = context.channel;
    return (channel) ? channel.canEmbedLinks : false;
  },
  onCancel: (context) => context.reply('⚠ Unable to embed in this channel.'),
  onBeforeRun: (context, args) => !!args.query || !!args.random,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

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

              const duration = moment.duration(movie.duration).format('y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]', {
                trim: 'both mid',
              });
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
                const duration = moment.duration(video.duration).format('y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]', {
                  trim: 'both mid',
                });
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
  },
  onRunError,
  onTypeError,
});
