import { Command, Interaction } from 'detritus-client';
import { Endpoints } from 'detritus-client-rest';
import { Components } from 'detritus-client/lib/utils';

import { Domains } from '../../../api/endpoints';
import { displayReply } from '../../../utils';
import { getTranslator, Languages } from '../../i18n';

import { CREDITS_ROLLOVER_PREMIUM_PLUS_AI } from './credits';


export const COMMAND_ID = 'bot.premium';

// the website's spanish and portuguese pages are under their own prefix, every other language gets the english one
const WEBSITE_PREFIXES: Partial<Record<Languages, string>> = Object.freeze({
  [Languages.PORTUGUESE_BRAZIL]: '/pt',
  [Languages.PORTUGUESE_PORTUGAL]: '/pt',
  [Languages.SPANISH]: '/es',
});

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate } = await getTranslator(context);
  const description = [
    translate('utils_premium.description'),
    translate('utils_premium.rollover', {credits: CREDITS_ROLLOVER_PREMIUM_PLUS_AI.toLocaleString(language)}),
  ];
  // the store tab lists every tier and the credit packs
  const storeUrl = Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_DIRECTORY_STORE(context.applicationId);
  const websiteUrl = `${Domains.STABLE}${WEBSITE_PREFIXES[language] || ''}/premium`;

  const components = new Components();
  const row = components.createActionRow();
  row.createButton({label: translate('utils_premium.store'), url: storeUrl});
  row.createButton({label: translate('utils_premium.compare'), url: websiteUrl});
  return displayReply(context, {
    components,
    componentsInside: true,
    description: description.join('\n\n'),
    // a nod to NotSoSuper, the bot's original creator. english in every language, the pun is on the name
    note: 'Isn’t this a NotSoSuper deal?',
    title: 'NotSoPremium',
  });
}
