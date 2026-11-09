import { Command, Interaction } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';

import { UserFull } from '../api/structures/user';
import UserStore from '../stores/users';
import { DiscordSkuIds, UserPremiumTypes } from '../constants';


// upsells for when a free (or lower tier) user hits something premium raises: the tier's name in the text becomes a link
// to its page in our store tab. not discord's premium button style, it doesn't render on mobile

// what each tier is called on its store page, the same in every language
const PREMIUM_SKU_NAMES: Record<DiscordSkuIds, string> = Object.freeze({
  [DiscordSkuIds.USER_NOTSOPREMIUM]: 'NotSoPremium',
  [DiscordSkuIds.USER_NOTSOPREMIUM_PLUS]: 'NotSoPremium Plus',
  [DiscordSkuIds.USER_NOTSOPREMIUM_PLUS_AI]: 'NotSoPremium Plus AI',
});

export function getPremiumSkuName(skuId: DiscordSkuIds): string {
  return PREMIUM_SKU_NAMES[skuId];
}

// the api names tiers like this in error metadata (`premium_tier`, a PREMIUM_REQUIRED's `tier`)
const PREMIUM_TIER_SKUS: Record<string, DiscordSkuIds> = Object.freeze({
  premium: DiscordSkuIds.USER_NOTSOPREMIUM,
  premium_plus: DiscordSkuIds.USER_NOTSOPREMIUM_PLUS,
  premium_plus_ai: DiscordSkuIds.USER_NOTSOPREMIUM_PLUS_AI,
});

export function getPremiumSkuFromTier(tier: unknown): DiscordSkuIds | null {
  return (typeof(tier) === 'string' && Object.prototype.hasOwnProperty.call(PREMIUM_TIER_SKUS, tier)) ? PREMIUM_TIER_SKUS[tier] : null;
}

// the tier a user's premium type is sold as, null without any. PREMIUM_FREE is given by hand and has every perk, so it's
// the top one
export function getPremiumSkuFromType(premiumType: UserPremiumTypes): DiscordSkuIds | null {
  switch (premiumType) {
    case UserPremiumTypes.PREMIUM: return DiscordSkuIds.USER_NOTSOPREMIUM;
    case UserPremiumTypes.PREMIUM_PLUS: return DiscordSkuIds.USER_NOTSOPREMIUM_PLUS;
    case UserPremiumTypes.PREMIUM_FREE:
    case UserPremiumTypes.PREMIUM_PLUS_AI: return DiscordSkuIds.USER_NOTSOPREMIUM_PLUS_AI;
  }
  return null;
}

// the tier's name on its own, not the start of a longer one ('NotSoPremium' in 'NotSoPremium Plus'). every language keeps
// the names in english, so this finds them in any translation
const PREMIUM_SKU_NAME_REGEXES: Record<DiscordSkuIds, RegExp> = Object.freeze({
  [DiscordSkuIds.USER_NOTSOPREMIUM]: /NotSoPremium(?! Plus)/,
  [DiscordSkuIds.USER_NOTSOPREMIUM_PLUS]: /NotSoPremium Plus(?! AI)/,
  [DiscordSkuIds.USER_NOTSOPREMIUM_PLUS_AI]: /NotSoPremium Plus AI/,
});


function hasPremiumSku(user: UserFull, skuId: DiscordSkuIds): boolean {
  switch (skuId) {
    case DiscordSkuIds.USER_NOTSOPREMIUM: return user.isPremium;
    case DiscordSkuIds.USER_NOTSOPREMIUM_PLUS: return user.isPremiumPlus;
    case DiscordSkuIds.USER_NOTSOPREMIUM_PLUS_AI: return user.isPremiumPlusAI;
  }
}

// the sku back when the user doesn't have that tier (or one that includes it), null when they do or we can't tell, so
// nobody gets told to buy what they already pay for
export async function getPremiumUpsellSku(
  context: Command.Context | Interaction.InteractionContext,
  skuId: DiscordSkuIds,
): Promise<DiscordSkuIds | null> {
  try {
    const user = await UserStore.getOrFetch(context, context.userId);
    return (user && !hasPremiumSku(user, skuId)) ? skuId : null;
  } catch(error) {
    return null;
  }
}


export function getPremiumStoreUrl(context: {applicationId: string}, skuId: DiscordSkuIds): string {
  return Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_DIRECTORY_STORE(context.applicationId, skuId);
}

// the first time the text names the tier, as a masked link to its store page (in <> so plain text replies don't embed
// it). unchanged when the tier isn't named
export function linkPremiumSkuName(
  context: {applicationId: string},
  text: string,
  skuId: DiscordSkuIds,
): string {
  return text.replace(PREMIUM_SKU_NAME_REGEXES[skuId], (name) => `[${name}](<${getPremiumStoreUrl(context, skuId)}>)`);
}
