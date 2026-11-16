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
      if (!member || !(member.isOwner || member.isClientOwner || member.can(Permissions.MANAGE_GUILD))) {
        return 'voice_server.manage_required';
      }
    } else if (!context.channel || context.channel.ownerId !== context.userId) {
      return 'voice_server.manage_required';
    }
  }
  return null;
}

// the api's `VoiceCloneTypes` that bill us (ElevenLabs 0, fish.audio 1): their voices need NotSoCredits to be changed and
// spend them when they speak. ZONOS3 (2, our own servers, what every new voice is made with) is free for everyone
export const PAID_VOICE_PLATFORM_TYPES: ReadonlyArray<number> = [0, 1];

// the platforms a voice can be cloned on or moved to (`-platform`/`platform`), ElevenLabs can't make new voices anymore
export enum VoiceClonePlatforms {
  FISH_AUDIO = 'FISH_AUDIO',
  ZONOS3 = 'ZONOS3',
}

export const VoiceClonePlatformsToText: Record<VoiceClonePlatforms, string> = Object.freeze({
  [VoiceClonePlatforms.FISH_AUDIO]: 'fish.audio',
  [VoiceClonePlatforms.ZONOS3]: 'ZONOS3',
});

// the api's `VoiceCloneTypes` for each
export const VoiceClonePlatformTypes: Record<VoiceClonePlatforms, number> = Object.freeze({
  [VoiceClonePlatforms.FISH_AUDIO]: 1,
  [VoiceClonePlatforms.ZONOS3]: 2,
});

// the slash commands' `platform` choices, ZONOS3 is what's used when it's left out
export const VOICE_CLONE_PLATFORM_CHOICES = [
  {name: 'ZONOS3 (free)', value: VoiceClonePlatforms.ZONOS3},
  {name: 'fish.audio (uses NotSoCredits)', value: VoiceClonePlatforms.FISH_AUDIO},
];

export function voicePlatformText(platformType: number): string {
  switch (platformType) {
    case 0: return 'ElevenLabs';
    case VoiceClonePlatformTypes.FISH_AUDIO: return VoiceClonePlatformsToText.FISH_AUDIO;
    case VoiceClonePlatformTypes.ZONOS3: return VoiceClonePlatformsToText.ZONOS3;
  }
  return String(platformType);
}

// why the user (with `server`, the server it's used in) can't clone on, move to or add audio to a voice on a paid
// platform, null when they can or it isn't one. The api's check, asked before the ownership confirmation so it doesn't fail after it: NotSoPremium
// Plus (a member's plus slot for a server, or the staff-given `VOICE_CLONE_ACCESS`), or bought NotSoCredits (given to the
// server). From `/premium/credits`, where a user's `weekly` is only there with plus and a server's voices' only with a
// plus slot
export async function voiceCloneAccessProblem(
  context: Command.Context | Interaction.InteractionContext,
  server: boolean,
  platformType: number,
): Promise<ErrorPayload | null> {
  if (!PAID_VOICE_PLATFORM_TYPES.includes(platformType)) {
    return null;
  }
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


// `platform_type` so a paid platform's voice can be checked for credits (`voiceCloneAccessProblem`)
export type FoundVoice = {id: string, name: string, platform_type: number};

export function findVoice(
  voices: Array<RestResponsesRaw.Voice>,
  voice: string,
  exact: boolean = false,
): FoundVoice | null {
  if (exact) {
    // for anything destructive, fuzzy matching could pick a different voice (`bob` deleting `rob`)
    const query = voice.trim().toLowerCase();
    const found = voices.find((x) => x.id === query) || voices.find((x) => x.name.toLowerCase() === query);
    return (found) ? {id: found.id, name: found.name, platform_type: found.platform_type} : null;
  }

  const search = new MiniSearch({
    fields: ['id', 'name'],
    storeFields: ['id', 'name', 'platform_type'],
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
    return results[0] as unknown as FoundVoice;
  }
  return null;
}
