import { Command, Utils } from 'detritus-client';

const { Markup, addQuery } = Utils;

import { searchUrban, searchUrbanRandom } from '../api';
import { CommandTypes, DateOptions, EmbedBrands, EmbedColors } from '../constants';
import { Paginator, onRunError, onTypeError } from '../utils';


const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';

export default (<Command.CommandOptions> {
  name: 'urban',
  args: [{name: 'random', type: Boolean}],
  label: 'query',
  metadata: {
    description: 'Search Urban Dictionary',
    examples: [
      'urban notsobot',
      'urban -random',
    ],
    type: CommandTypes.SEARCH,
    usage: 'urban <query> (-random)',
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
  run: async (context, args) => {
    await context.triggerTyping();

    let results: any;
    if (args.random) {
      results = await searchUrbanRandom(context);
    } else {
      results = await searchUrban(context, args);
    }
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const result = results[page - 1];

          const created = new Date(result.written_on);

          const embed = new Utils.Embed();
          embed.setAuthor(context.user.toString(), context.user.avatarUrlFormat(null, {size: 1024}), context.user.jumpLink);
          embed.setColor(EmbedColors.DEFAULT);
          embed.setTitle(result.word);
          embed.setUrl(result.permalink);

          const definition = result.definition.replace(ReplacementRegex, (found: string, word: string) => {
            const url = addQuery(UrbanUrl, {term: word});
            return Markup.url(word, url);
          });
          embed.setDescription([
            `Created by ${Markup.escape.all(result.author)} on ${created.toLocaleString('en-US', DateOptions)}`,
            `${result.thumbs_up.toLocaleString()} Likes, ${result.thumbs_down.toLocaleString()} Dislikes`,
            '\n' + Markup.escape.all(definition),
          ].join('\n'));

          const example = result.example.replace(ReplacementRegex, (found: string, word: string) => {
            const url = addQuery(UrbanUrl, {term: word});
            return Markup.url(word, url);
          });
          embed.addField('Example', Markup.escape.all(example));
          embed.setFooter(`Page ${page}/${pageLimit} of Urban Dictionary Results`, EmbedBrands.URBAN);

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return context.editOrReply('Couldn\'t find any definitions for that search term');
    }
  },
  onRunError,
  onTypeError,
});
