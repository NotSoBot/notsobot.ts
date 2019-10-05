import { Command, Utils } from 'detritus-client';

const { Markup } = Utils;

import { searchDuckDuckGoImages } from '../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../constants';
import { Paginator, onRunError, onTypeError } from '../utils';


export interface CommandArgs {
  query: string,
}

export default (<Command.CommandOptions> {
  name: 'duckduckgoimage',
  aliases: ['ddgimg'],
  label: 'query',
  metadata: {
    description: 'Search DuckDuckGo Images',
    examples: [
      'duckduckgoimage notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'duckduckgoimage <query>',
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
  onBeforeRun: (context, args) => !!args.query,
  onCancelRun: (context, args) => context.editOrReply('⚠ Provide some kind of search term.'),
  run: async (context, args: CommandArgs) => {
    await context.triggerTyping();

    const results = await searchDuckDuckGoImages(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setFooter(`Page ${page}/${pageLimit} of Duck Duck Go Image Results`, EmbedBrands.DUCK_DUCK_GO);

          const result = results[page - 1];
          embed.setTitle(`Found from ${result.source}`);
          embed.setDescription(Markup.url(Markup.escape.all(result.title), result.url));
          embed.setImage(result.image);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any results for that search term');
    }
  },
  onRunError,
  onTypeError,
});
