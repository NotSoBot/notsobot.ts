import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchSteamEmojis } from '../../api';
import { CommandTypes, EmbedBrands, EmbedColors } from '../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../utils';

import { BaseSearchCommand } from '../basecommand';


export interface CommandArgsBefore {
  query: string,
}

export interface CommandArgs {
  query: string,
}

export const COMMAND_NAME = 'steam emoji';

export default class SteamEmojiCommand extends BaseSearchCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['steam e'],
      metadata: {
        description: 'Search all of Steam\'s Emojis',
        examples: [
          `${COMMAND_NAME} b1`,
          `${COMMAND_NAME} sleep`,
        ],
        type: CommandTypes.SEARCH,
        usage: '<query>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { count, results } = await searchSteamEmojis(context, args);

    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = createUserEmbed(context.user);
          embed.setColor(EmbedColors.DEFAULT);

          const result = results[page - 1];
          embed.setFooter(`Page ${page}/${pageLimit} of Steam Emojis (${count.toLocaleString()} Total Emojis)`, EmbedBrands.STEAM);

          embed.setTitle(result.name);
          embed.setUrl(result.url);
          embed.setImage(result.icon);

          {
            const description: Array<string> = [result.metadata.type, ''];

            description.push(`**Commodity**: ${(result.metadata.commodity) ? 'Yes' : 'No'}`);
            description.push(`**Market Listings**: ${result.sell_listings.toLocaleString()}`);
            if (result.sell_listings) {
              description.push(`**Market Price**: ${result.sell_price_text}`);
            }
            description.push(`**Tradable**: ${(result.metadata.tradable) ? 'Yes' : 'No'}`);

            embed.setDescription(description.join('\n'));
          }

          return embed;
        },
      });
      return await paginator.start();
    } else {
      return editOrReply(context, 'Couldn\'t find any steam emojis matching that search term');
    }
  }
}
