import { Command, Interaction } from 'detritus-client';
import { Embed } from 'detritus-client/lib/utils';

import { searchSteamEmojis } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../../utils';


export const COMMAND_ID = 'search.steam.emojis';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { count, results } = await searchSteamEmojis(context, args);

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        const result = results[page - 1];
        embed.setFooter(translate('search_steam_emojis.page_of_steam_emojis_total_emojis', {count: count.toLocaleString(language), page: page, pageLimit: pageLimit}), EmbedBrands.STEAM);

        embed.setTitle(result.name);
        embed.setUrl(result.url);
        embed.setImage(result.icon);

        {
          const description: Array<string> = [result.metadata.type, ''];

          description.push(translate('search_steam_emojis.commodity', {commodity: (result.metadata.commodity) ? translate('common.yes') : translate('common.no')}));
          description.push(translate('search_steam_emojis.market_listings', {sell_listings: result.sell_listings}));
          if (result.sell_listings) {
            description.push(translate('search_steam_emojis.market_price', {sell_price_text: result.sell_price_text}));
          }
          description.push(translate('search_steam_emojis.tradable', {tradable: (result.metadata.tradable) ? translate('common.yes') : translate('common.no')}));

          embed.setDescription(description.join('\n'));
        }

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, translate('search_steam_emojis.couldn_t_find_any_steam_emojis_matching'));
}

