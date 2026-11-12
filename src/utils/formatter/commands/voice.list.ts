import { Command, Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import MiniSearch from 'minisearch';

import { ErrorPayload, warning } from '../../../commands/errors';
import GuildSettingsStore from '../../../stores/guildsettings';
import { getPremiumServerId } from '../../../stores/premiumservers';
import { fetchPremiumCredits, fetchServerVoices, fetchUserVoices } from '../../../api';
import { getTranslator } from '../../i18n';
import { RestResponsesRaw } from '../../../api/types';
import {
  DiscordSkuIds,
  EmbedBrands,
  EmbedColors,
  GoogleLocales,
  GoogleLocalesText,
  GuildFeatures,
} from '../../../constants';
import { DisplayPayload, displayReply } from '../../../utils';
import { getPremiumSkuName } from '../../premium';


export const COMMAND_ID = 'voice.list';


export interface CommandArgs {
  // the server's voices instead of the user's
  server?: boolean,
}

// why the user can't use (or with `manage`, change) the voices of the server it's used in, null when they can. The api
// only checks the voice belongs to that server, Manage Server (a group dm's owner) is checked here
export function serverVoicesProblem(
  context: Command.Context | Interaction.InteractionContext,
  manage: boolean,
): null | 'premium_servers.only_in_a_server' | 'voice_server.manage_required' {
  if (!getPremiumServerId(context)) {
    return 'premium_servers.only_in_a_server';
  }
  if (manage) {
    if (context.guildId) {
      const member = context.member;
      if (!member || !(member.isOwner || member.can(Permissions.MANAGE_GUILD))) {
        return 'voice_server.manage_required';
      }
    } else if (!context.channel || context.channel.ownerId !== context.userId) {
      return 'voice_server.manage_required';
    }
  }
  return null;
}

// why the user (with `server`, the server it's used in) can't clone voices or add audio to them, null when they can.
// The api's check, asked before the ownership confirmation so it doesn't fail after it: NotSoPremium Plus (a member's
// plus slot for a server, or the staff-given `VOICE_CLONE_ACCESS`), or bought NotSoCredits (given to the server). From
// `/premium/credits`, where a user's `weekly` is only there with plus and a server's voices' only with a plus slot
export async function voiceCloneAccessProblem(
  context: Command.Context | Interaction.InteractionContext,
  server: boolean,
): Promise<ErrorPayload | null> {
  const credits = await fetchPremiumCredits(context);
  const { translate } = await getTranslator(context);
  const skuId = DiscordSkuIds.USER_NOTSOPREMIUM_PLUS;
  if (server) {
    if ((credits.server_voices && 0 < credits.server_voices.weekly) || (credits.server && 0 < credits.server.refill_left)) {
      return null;
    }
    if (context.guildId) {
      const settings = await GuildSettingsStore.getOrFetch(context, context.guildId);
      if (settings && settings.features.has(GuildFeatures.VOICE_CLONE_ACCESS)) {
        return null;
      }
    }
    return {
      description: warning(translate('api_errors.premium_required_server_credits')),
      upsell: {skuId, text: translate('errors.upsell.premium_server')},
    };
  }
  // owners have no pool, they never need either
  if (!credits.user || 0 < credits.user.weekly || 0 < credits.user.refill_left) {
    return null;
  }
  return {
    description: warning(translate('api_errors.premium_required_tier_credits', {tier: getPremiumSkuName(skuId)})),
    upsell: {skuId},
  };
}

// the user's own voices, or with `server` the server's it's used in and how many it can have (the api's, it depends on
// the server's premium), null for the user's
export async function fetchVoices(
  context: Command.Context | Interaction.InteractionContext,
  server?: boolean,
): Promise<{limit: null | number, voices: Array<RestResponsesRaw.Voice>}> {
  if (server) {
    const { limit, voices } = await fetchServerVoices(context);
    return {limit, voices};
  }
  return {limit: null, voices: (await fetchUserVoices(context, context.userId)).voices};
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);

  if (args.server) {
    const problem = serverVoicesProblem(context, false);
    if (problem) {
      return displayReply(context, {description: translate(problem)});
    }
  }

  const { limit, voices } = await fetchVoices(context, args.server);
  if (!voices.length) {
    if (args.server) {
      return displayReply(context, {description: translate('voice_server.no_voices', {max: limit ?? 0})});
    }
    return displayReply(context, {description: translate('voice_list.you_have_no_cloned_voices')});
  }

  const payload: DisplayPayload = {fields: []};
  payload.color = EmbedColors.DEFAULT;
  payload.footer = (args.server) ? translate('voice_server.voices', {count: voices.length, max: limit ?? 0}) : translate('voice_list.cloned_voices');

  const description: Array<string> = [];
  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    description.push(`${i + 1}. ${Markup.codestring(voice.name)}`);
  }
  payload.description = description.join('\n');

  return displayReply(context, payload);
}


export function findVoice(
  voices: Array<RestResponsesRaw.Voice>,
  voice: string,
  exact: boolean = false,
): {id: string, name: string} | null {
  if (exact) {
    // for anything destructive, fuzzy matching could pick a different voice (`bob` deleting `rob`)
    const query = voice.trim().toLowerCase();
    const found = voices.find((x) => x.id === query) || voices.find((x) => x.name.toLowerCase() === query);
    return (found) ? {id: found.id, name: found.name} : null;
  }

  const search = new MiniSearch({
    fields: ['id', 'name'],
    storeFields: ['id', 'name'],
    searchOptions: {
      boost: {name: 2},
      fuzzy: true,
      prefix: true,
      weights: {fuzzy: 0.2, prefix: 1},
    },
  });
  search.addAll(voices);

  const results = search.search(voice);
  if (results.length) {
    return results[0] as unknown as {id: string, name: string};
  }
  return null;
}
