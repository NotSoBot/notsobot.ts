import { Command, CommandClient, Utils } from 'detritus-client';
const { Markup, addQuery } = Utils;

import { searchUrban, searchUrbanRandom } from '../../api';
import { CommandTypes, DateOptions, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, triggerTypingAfter } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


const ReplacementRegex = /\[([\s\S]+?)\]/g;
const UrbanUrl = 'https://www.urbandictionary.com/define.php';


export interface CommandArgsBefore {
  query: string,
  random: boolean,
}

export interface CommandArgs {
  query: string,
  random: boolean,
}

export default class UrbanCommand extends BaseSearchCommand<CommandArgs> {
  name = 'urban';

  metadata = {
    description: 'Search Urban Dictionary',
    examples: [
      'urban notsobot',
      'urban -random',
    ],
    type: CommandTypes.SEARCH,
    usage: 'urban <query> (-random)',
  };

  constructor(client: CommandClient, options: Command.CommandOptions) {
    super(client, {
      ...options,
      args: [{name: 'random', type: Boolean}],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.query || !!args.random;
  }

  async run(context: Command.Context, args: CommandArgs) {
    await triggerTypingAfter(context);

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
  }
}
