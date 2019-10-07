import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { googleSearchYoutube } from '../api';
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

    const results = await googleSearchYoutube(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const result = results[page - 1];

          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setFooter(`Page ${page}/${pageLimit} of Youtube Search Results`, EmbedBrands.YOUTUBE);

          embed.setTitle(result.title);
          embed.setUrl(result.url);

          if (result.description) {
            embed.setDescription(Markup.escape.all(result.description));
          }
          if (result.thumbnail) {
            embed.setThumbnail(result.thumbnail);
          }

          switch (result.type) {
            case YoutubeResultTypes.CHANNEL: {

            }; break;
            case YoutubeResultTypes.VIDEO: {
              const video = result.metadata;

              const description: Array<string> = [];
              description.push(`[Channel](${video.channel_url})`);

              const duration = moment.duration(video.duration).format('y [years], w [weeks], d [days], h [hours], m [minutes], s [seconds]', {
                trim: 'both mid',
              });
              description.push(`**Duration**: ${duration}`);

              description.push(`**Family Friendly**: ${(video.is_family_friendly) ? 'Yes' : 'No'}`)
              description.push(`**Monetized**: ${(video.is_paid) ? 'Yes' : 'No'}`);
              if (video.published) {
                const date = moment(video.published);
                description.push(`**Published**: ${date.format('MMMM Do YYYY')}`);
              }
              description.push(`**Unlisted**: ${(video.is_unlisted) ? 'Yes': 'No'}`);
              if (video.uploaded) {
                const date = moment(video.uploaded);
                description.push(`**Uploaded**: ${date.format('MMMM Do YYYY')}`);
              }
              description.push(`**Views**: ${video.views.toLocaleString()}`);

              embed.addField('Information', description.join('\n'));
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
