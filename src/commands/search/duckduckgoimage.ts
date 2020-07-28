import { Command } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchDuckDuckGoImages } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgs {
  query: string,
}

export default class DuckDuckGoImageCommand extends BaseSearchCommand<CommandArgs> {
  aliases = ['ddgimg'];
  name = 'duckduckgoimage';

  metadata = {
    description: 'Search DuckDuckGo Images',
    examples: [
      'duckduckgoimage notsobot',
    ],
    type: CommandTypes.SEARCH,
    usage: 'duckduckgoimage <query>',
  };

  async run(context: Command.Context, args: CommandArgs) {
    const results = await searchDuckDuckGoImages(context, args);
    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
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
  }
}
