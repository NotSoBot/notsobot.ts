import { Command, Interaction } from 'detritus-client';

import { searchSteamEmojis } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.steam.emojis';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { count, results } = await searchSteamEmojis(context, args);

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const payload: DisplayPayload = {fields: []};
        payload.color = EmbedColors.DEFAULT;

        const result = results[page - 1];
        payload.footer = translate('search_steam_emojis.page_of_steam_emojis_total_emojis', {count: count.toLocaleString(language), page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.STEAM;

        payload.title = result.name;
        payload.url = result.url;
        payload.image = result.icon;

        {
          const description: Array<string> = [result.metadata.type, ''];

          description.push(translate('search_steam_emojis.commodity', {commodity: (result.metadata.commodity) ? translate('common.yes') : translate('common.no')}));
          description.push(translate('search_steam_emojis.market_listings', {sell_listings: result.sell_listings}));
          if (result.sell_listings) {
            description.push(translate('search_steam_emojis.market_price', {sell_price_text: result.sell_price_text}));
          }
          description.push(translate('search_steam_emojis.tradable', {tradable: (result.metadata.tradable) ? translate('common.yes') : translate('common.no')}));

          payload.description = description.join('\n');
        }

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_steam_emojis.couldn_t_find_any_steam_emojis_matching')});
}

