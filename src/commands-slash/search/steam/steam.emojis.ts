import { Slash } from 'detritus-client';
import { InteractionCallbackTypes } from 'detritus-client/lib/constants';
import { Embed } from 'detritus-client/lib/utils';

import { searchSteamEmojis } from '../../../api';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, editOrReply } from '../../../utils';

import { BaseCommandOption } from '../../basecommand';



export interface CommandArgs {
  query: string,
}

export class SearchSteamEmojisCommand extends BaseCommandOption {
  description = 'Search Steam\'s Emojis';
  name = 'emojis';

  constructor() {
    super({
      options: [
        {name: 'query', description: 'Search Text', required: true},
      ],
    });
  }

  async run(context: Slash.SlashContext, args: CommandArgs) {
    const { count, results } = await searchSteamEmojis(context, args);

    if (results.length) {
      const pageLimit = results.length;
      const paginator = new Paginator(context, {
        pageLimit,
        onPage: (page) => {
          const embed = new Embed();
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
    }
    return editOrReply(context, 'Couldn\'t find any steam emojis matching that search term');
  }
}
