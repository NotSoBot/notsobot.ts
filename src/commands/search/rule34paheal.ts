import * as moment from 'moment';

import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { searchRule34Paheal } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, onRunError, onTypeError } from '../../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'rule34paheal',
  aliases: ['r34paheal', 'r34p', 'paheal', 'pahe'],
  label: 'query',
  metadata: {
    description: 'Search https://rule34.paheal.net',
    examples: [
      'rule34paheal overwatch',
    ],
    type: CommandTypes.SEARCH,
    usage: 'rule34paheal <query>',
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

    const results = await searchRule34Paheal(context, args);
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
          embed.setFooter(`Page ${page}/${pageLimit} of Paheal Rule34 Results`);

          embed.setTitle((result.is_video) ? `${result.file_name} (Video)` : result.file_name);
          embed.setUrl(result.url);

          const description: Array<string> = [];
          description.push(`Created by ${Markup.url(Markup.escape.all(result.author.id), result.author.url)}`);
          description.push(`Uploaded ${moment(result.created_at).fromNow()}`);
          description.push(`**Score**: ${result.score.toLocaleString()}`);
          if (result.source) {
            if (result.source.startsWith('https://') || result.source.startsWith('http://')) {
              description.push(`${Markup.url('**Source**', result.source)}`);
            } else {
              description.push(`**Source**: ${result.source}`);
            }
          }
          if (result.tags.length) {
            description.push(`**Tags**: ${Markup.escape.all(result.tags.sort().join(', '))}`);
          }
          embed.setDescription(description.join('\n'));

          let imageUrl: string;
          if (result.is_video) {
            imageUrl = result.thumbnail_url;
          } else {
            imageUrl = result.file_url;
          }
          // https is broken for these for some reason
          embed.setImage(imageUrl.replace('https://', 'http://'));

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
