import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { searchSteamProfile } from '../../../api';
import { getTranslator } from '../../i18n';
import { EmbedBrands, EmbedColors } from '../../../constants';
import { DisplayPayload, displayDetails, displayDetailsLine, displayReply } from '../../../utils';


export const COMMAND_ID = 'search.steam.profile';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  const profile = await searchSteamProfile(context, args);

  const payload: DisplayPayload = {};
  switch (profile.state) {
    case 'in-game': {
      payload.color = EmbedColors.STEAM_IN_GAME;
    }; break;
    case 'online': {
      payload.color = EmbedColors.STEAM_ONLINE;
    }; break;
    default: {
      payload.color = EmbedColors.STEAM_OFFLINE;
    };
  }

  payload.title = profile.username;
  payload.url = profile.url;

  payload.footer = translate('search_steam_profile.steam_community_profile');
  payload.footerIconUrl = EmbedBrands.STEAM;
  payload.thumbnail = profile.avatar.full;

  const lines: Array<string> = [translate('search_steam_profile.currently', {state_message: profile.state_message})];
  if (profile.in_game) {
    lines.push(displayDetailsLine([
      translate('search_steam_profile.game', {name: Markup.url(profile.in_game.name, profile.in_game.url)}),
      (profile.in_game_ip) && translate('search_steam_profile.server_ip', {in_game_ip: Markup.codestring(profile.in_game_ip)}),
      (profile.in_game.join_link) && translate('search_steam_profile.server_link', {join_link: profile.in_game.join_link}),
    ]));
  }
  lines.push(displayDetailsLine([
    translate('search_steam_profile.joined', {member_since: profile.member_since}),
    (profile.location) && translate('search_steam_profile.location', {location: profile.location}),
    (profile.custom_url) && translate('search_steam_profile.custom_url', {custom_url: Markup.codestring(profile.custom_url)}),
  ]));
  lines.push(displayDetailsLine([
    translate('search_steam_profile.vac_d', {is_vac_banned: (profile.is_vac_banned) ? translate('common.yes') : translate('common.no')}),
    translate('search_steam_profile.trade_ban', {trade_ban_state: profile.trade_ban_state}),
    translate('search_steam_profile.limited', {is_limited_account: (profile.is_limited_account) ? translate('common.yes') : translate('common.no')}),
  ]));
  if (profile.past_names.length) {
    const names = profile.past_names.map(({ name, timestamp }) => Markup.codestring(`${name} on ${timestamp}`));
    lines.push(`${translate('search_steam_profile.past_names')}: ${names.join(', ')}`);
  }
  lines.push(displayDetailsLine([
    translate('search_steam_profile.id', {profile: Markup.codestring(profile.id)}),
    translate('search_steam_profile.id64', {id_64: Markup.codestring(profile.id_64)}),
  ], true));
  payload.description = displayDetails(lines);

  return displayReply(context, payload);
}
