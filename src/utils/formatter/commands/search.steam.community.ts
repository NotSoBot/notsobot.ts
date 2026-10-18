import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchSteam } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, Paginator, displayDetails, displayDetailsLine, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.steam.community';

export interface CommandArgs {
  as?: string,
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const { count, results } = await searchSteam(context, {
    query: args.query,
    steamId: args.as,
  });

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const payload: DisplayPayload = {};
        payload.color = EmbedColors.DEFAULT;

        const result = results[page - 1];
        payload.footer = translate('search_steam_community.page_of_steam_community_results_total_results', {count: count.toLocaleString(language), page: page, pageLimit: pageLimit});
        payload.footerIconUrl = EmbedBrands.STEAM;
        payload.thumbnail = result.avatar_url;

        payload.title = result.username;
        payload.url = result.url;

        payload.description = displayDetails([
          displayDetailsLine([
            (result.real_name) && Markup.escape.all(result.real_name),
            (result.country) && translate('search_steam_community.located', {country: result.country}),
          ]),
          (result.past_names.length) && translate('search_steam_community.also_known_as', {past_names: result.past_names.map((name) => Markup.codestring(name)).join(', ')}),
          (result.in_common.length) && translate('search_steam_community.in_common', {in_common: result.in_common.map((string) => Markup.bold(string)).join(translate('logger.and'))}),
          displayDetailsLine([
            (result.custom_url) && translate('search_steam_community.custom_url', {custom_url: Markup.codestring(result.custom_url)}),
            (result.steam_id) && translate('search_steam_community.id', {steam_id: Markup.codestring(result.steam_id)}),
            (result.steam_id_64) && translate('search_steam_community.id64', {steam_id_64: Markup.codestring(result.steam_id_64)}),
          ], true),
        ]) || undefined;

        return {display: payload};
      },
    });
    return await paginator.start();
  }
  return displayReply(context, {description: translate('search_steam_community.couldn_t_find_any_steam_accounts_matching')});
}

