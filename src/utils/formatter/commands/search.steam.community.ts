import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchSteam } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { Paginator, createUserEmbed, editOrReply } from '../../../utils';


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
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const { count, results } = await searchSteam(context, {
    query: args.query,
    steamId: args.as,
  });

  if (results.length) {
    const pageLimit = results.length;
    const paginator = new Paginator(context, {
      pageLimit,
      onPage: (page) => {
        const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
        embed.setColor(EmbedColors.DEFAULT);

        const result = results[page - 1];
        embed.setFooter(
          translate('search_steam_community.page_of_steam_community_results_total_results', {count: count.toLocaleString(language), page: page, pageLimit: pageLimit}),
          EmbedBrands.STEAM,
        );
        embed.setThumbnail(result.avatar_url);

        embed.setTitle(result.username);
        embed.setUrl(result.url);

        {
          const description: Array<string> = [];

          if (result.real_name) {
            description.push(Markup.escape.all(result.real_name));
          }
          if (result.country) {
            description.push(translate('search_steam_community.located', {country: result.country}));
          }
          if (description.length) {
            description.push('');
          }

          if (result.past_names.length) {
            description.push(translate('search_steam_community.also_known_as', {past_names: result.past_names.map((name) => Markup.bold(Markup.codestring(name))).join(', ')}));
          }
          if (result.in_common.length) {
            description.push(translate('search_steam_community.in_common', {in_common: result.in_common.map((string) => Markup.bold(string)).join(translate('logger.and'))}));
          }
          if (result.custom_url) {
            description.push(translate('search_steam_community.custom_url', {custom_url: Markup.codestring(result.custom_url)}));
          }
          if (result.steam_id) {
            description.push(translate('search_steam_community.id', {steam_id: Markup.codestring(result.steam_id)}));
          }
          if (result.steam_id_64) {
            description.push(translate('search_steam_community.id64', {steam_id_64: Markup.codestring(result.steam_id_64)}));
          }

          if (description.length) {
            embed.setDescription(description.join('\n'));
          }
        }

        return embed;
      },
    });
    return await paginator.start();
  }
  return editOrReply(context, translate('search_steam_community.couldn_t_find_any_steam_accounts_matching'));
}

