import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { searchRule34 } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'rule34',
  aliases: ['r34'],
  label: 'query',
  metadata: {
    description: 'Search https://rule34.xxx',
    examples: [
      'rule34 some anime chick',
    ],
    type: CommandTypes.SEARCH,
    usage: 'rule34 <query>',
  },
  ratelimits: [
    {duration: 5000, limit: 5, type: 'guild'},
    {duration: 1000, limit: 1, type: 'channel'},
  ],
  onBefore: (context) => {
    if (context.channel) {
      return context.channel.canEmbedLinks && context.channel.nsfw;
    }
    return false;
  },
  onCancel: (context) => {
    if (context.channel && !context.channel.nsfw) {
      return context.editOrReply('⚠ Not a NSFW channel.');
    }
    return context.editOrReply('⚠ Unable to embed in this channel.');
  },
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const results = await searchRule34(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          if (result.header) {
            embed.setTitle(`${result.header} (${result.footer})`);
          } else {
            embed.setTitle(result.footer);
          }
          embed.setFooter(`Page ${page}/${pageLimit} of https://rule34.xxx Results`);

          embed.setTitle((result.is_video) ? 'Video Post' : 'Image Post');
          embed.setUrl(result.url);

          const description: Array<string> = [];
          description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          description.push(`**Score**: ${result.score.toLocaleString()}`);
          if (result.source) {
            if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
              const cite = <string> (<string> result.source.split('://')[1]).split('/').shift();
              description.push(`**Source**: ${Markup.url(Markup.escape.all(cite), result.source)}`);
            } else {
              description.push(`**Source**: ${result.source}`);
            }
          }
          embed.setDescription(description.join('\n'));

          let imageUrl: string;
          if (result.is_video) {
            imageUrl = result.thumbnail_url;
          } else {
            imageUrl = result.file_url;
          }
          embed.setImage(imageUrl);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any images for that search term');
    }
  },
  onRunError,
  onTypeError,
});
