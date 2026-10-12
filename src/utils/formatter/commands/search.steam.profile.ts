import { Command, Interaction } from 'detritus-client';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { searchSteamProfile } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { createUserEmbed, editOrReply } from '../../../utils';


export const COMMAND_ID = 'search.steam.profile';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const isFromInteraction = (context instanceof Interaction.InteractionContext);

  const profile = await searchSteamProfile(context, args);

  const embed = (isFromInteraction) ? new Embed() : createUserEmbed(context.user);
  switch (profile.state) {
    case 'in-game': {
      embed.setColor(EmbedColors.STEAM_IN_GAME);
    }; break;
    case 'online': {
      embed.setColor(EmbedColors.STEAM_ONLINE);
    }; break;
    default: {
      embed.setColor(EmbedColors.STEAM_OFFLINE);
    };
  }

  embed.setTitle(profile.username);
  embed.setUrl(profile.url);

  embed.setFooter(translate('search_steam_profile.steam_community_profile'), EmbedBrands.STEAM);
  embed.setThumbnail(profile.avatar.full);

  {
    const description: Array<string> = [];
    description.push(translate('search_steam_profile.currently', {state_message: profile.state_message}));
    description.push('');

    if (profile.custom_url) {
      description.push(translate('search_steam_profile.custom_url', {custom_url: Markup.codestring(profile.custom_url)}));
    }
    description.push(translate('search_steam_profile.joined', {member_since: profile.member_since}));
    description.push(translate('search_steam_profile.limited', {is_limited_account: (profile.is_limited_account) ? translate('common.yes') : translate('common.no')}));
    if (profile.location) {
      description.push(translate('search_steam_profile.location', {location: profile.location}));
    }
    description.push(translate('search_steam_profile.id', {profile: Markup.codestring(profile.id)}));
    description.push(translate('search_steam_profile.id64', {id_64: Markup.codestring(profile.id_64)}));
    description.push(translate('search_steam_profile.trade_ban', {trade_ban_state: profile.trade_ban_state}));
    description.push(translate('search_steam_profile.vac_d', {is_vac_banned: (profile.is_vac_banned) ? translate('common.yes') : translate('common.no')}));

    embed.setDescription(description.join('\n'));
  }

  if (profile.in_game) {
    const description: Array<string> = []

    description.push(translate('search_steam_profile.game', {name: Markup.url(profile.in_game.name, profile.in_game.url)}));
    if (profile.in_game_ip) {
      description.push(translate('search_steam_profile.server_ip', {in_game_ip: Markup.codestring(profile.in_game_ip)}));
    }
    if (profile.in_game.join_link) {
      description.push(translate('search_steam_profile.server_link', {join_link: profile.in_game.join_link}));
    }

    embed.addField(translate('search_steam_profile.in_game'), description.join('\n'));
  }

  if (profile.past_names.length) {
    const description: Array<string> = [];

    for (let { name, timestamp } of profile.past_names) {
      description.push(Markup.codestring(`${name} on ${timestamp}`));
    }

    embed.addField(translate('search_steam_profile.past_names'), description.join('\n'));
  }

  return editOrReply(context, {embed});
}
