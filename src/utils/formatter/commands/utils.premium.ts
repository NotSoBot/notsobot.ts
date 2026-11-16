import { Command, Interaction } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';
import { Components, Markup } from 'detritus-client/lib/utils';

import { fetchPremiumLimits } from '../../../api';
import { Domains } from '../../../api/endpoints';
import { RestResponsesRaw } from '../../../api/types';
import { DisplayBlock, displayDetails, displayDetailsLine, displayReply, formatMemory } from '../../../utils';
import { getTranslator, Languages, Translator } from '../../i18n';
import { getPremiumSkuFromTier, getPremiumSkuName } from '../../premium';

import { CREDITS_ROLLOVER_PREMIUM_MAX } from './credits';


export const COMMAND_ID = 'bot.premium';

// the website's spanish and portuguese pages are under their own prefix, every other language gets the english one
const WEBSITE_PREFIXES: Partial<Record<Languages, string>> = Object.freeze({
  [Languages.PORTUGUESE_BRAZIL]: '/pt',
  [Languages.PORTUGUESE_PORTUGAL]: '/pt',
  [Languages.SPANISH]: '/es',
});

function tierName(tier: null | string): null | string {
  const skuId = getPremiumSkuFromTier(tier);
  return (skuId) ? getPremiumSkuName(skuId) : null;
}

// "your limits here": what the caller gets where it's used, their own premium or the server's slot (the api works it out
// the way jobs do), then what's kept against how much fits. Credits stay in `credits`, this points there
function createLimitsBlock(
  context: Command.Context | Interaction.InteractionContext,
  limits: RestResponsesRaw.FetchPremiumLimits,
  language: string,
  translate: Translator['translate'],
): DisplayBlock {
  const number = (value: number) => value.toLocaleString(language);
  let source: string;
  if (limits.source === 'user') {
    source = translate('utils_premium.limits_yours', {tier: tierName(limits.tier) || 'NotSoPremium'});
  } else if (limits.source === 'server') {
    source = translate('utils_premium.limits_from_server', {tier: tierName(limits.server_tier) || 'NotSoPremium Plus'});
  } else {
    source = translate('utils_premium.limits_free');
  }

  type CountKey = 'utils_premium.limits_fonts' | 'utils_premium.limits_server_fonts' | 'utils_premium.limits_server_voices' | 'utils_premium.limits_voices';
  const count = (key: CountKey, value: RestResponsesRaw.LimitCount | null, available: boolean = true) => {
    return (value && available) ? translate(key, {count: number(value.count), max: number(value.limit)}) : null;
  };
  const credits = (context instanceof Interaction.InteractionContext) ? '/settings credits balance' : `${(context as Command.Context).prefix}credits`;
  const content = displayDetails([
    displayDetailsLine([
      (limits.file_size === null) ? translate('utils_premium.limits_file_size_discord', {size: formatMemory(limits.file_size_discord_max)}) : translate('utils_premium.limits_file_size', {size: formatMemory(limits.file_size)}),
      translate('utils_premium.limits_downloads', {quality: limits.download_quality}),
      translate('utils_premium.limits_frames', {count: number(limits.frames)}),
      translate('utils_premium.limits_images', {size: number(limits.still_size)}),
    ]),
    displayDetailsLine([
      translate('utils_premium.limits_times', {code: number(limits.code_seconds), media: number(limits.media_seconds), tags: number(limits.tag_seconds)}),
      translate('utils_premium.limits_file_days', {days: number(limits.file_days)}),
    ]),
    displayDetailsLine([
      count('utils_premium.limits_voices', limits.voices),
      count('utils_premium.limits_fonts', limits.fonts, !!limits.fonts && limits.fonts.available),
      count('utils_premium.limits_server_voices', limits.server_voices),
      count('utils_premium.limits_server_fonts', limits.server_fonts, !!limits.server_fonts && limits.server_fonts.available),
    ]),
    displayDetailsLine([translate('utils_premium.limits_credits', {command: Markup.codestring(credits)})], true),
  ]);
  return {content, details: source, heading: translate('utils_premium.limits_heading')};
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate } = await getTranslator(context);
  // an api without `/premium/limits` (or one that's down) still shows the rest
  let limits: RestResponsesRaw.FetchPremiumLimits | null = null;
  try {
    limits = await fetchPremiumLimits(context);
  } catch(error) {

  }
  const description = [
    translate('utils_premium.description'),
    translate('utils_premium.rollover', {credits: CREDITS_ROLLOVER_PREMIUM_MAX.toLocaleString(language)}),
  ];
  // the store tab lists every tier and the credit packs
  const storeUrl = Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_DIRECTORY_STORE(context.applicationId);
  const websiteUrl = `${Domains.STABLE}${WEBSITE_PREFIXES[language] || ''}/premium`;

  const components = new Components();
  const row = components.createActionRow();
  row.createButton({label: translate('utils_premium.store'), url: storeUrl});
  row.createButton({label: translate('utils_premium.compare'), url: websiteUrl});
  return displayReply(context, {
    blocks: (limits) ? [createLimitsBlock(context, limits, language, translate)] : undefined,
    components,
    componentsInside: true,
    description: description.join('\n\n'),
    // a nod to NotSoSuper, the bot's original creator. english in every language, the pun is on the name
    note: 'Isn’t this a NotSoSuper deal?',
    title: 'NotSoPremium',
  });
}
