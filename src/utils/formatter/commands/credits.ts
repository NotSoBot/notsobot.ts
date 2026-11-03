import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { getPremiumServerId } from '../../../stores/premiumservers';
import { Translator, getTranslator } from '../../i18n';

import { fetchPremiumCredits } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { EmbedColors } from '../../../constants';
import { DisplayPayload, displayDetailsLine, displayReply, displayTimestamp } from '../../../utils';


export const COMMAND_ID = 'credits';

// the api's `CREDITS_AI_MESSAGE` and `CREDITS_PER_TTS_BYTE`, what one NotSoAI message and a letter of cloned speech cost
export const CREDITS_AI_MESSAGE = 75;
export const CREDITS_PER_TTS_BYTE = 4;

export interface CommandArgs {

}

// a pool's weekly credits (when it gets any), its bought ones and when the weekly ones come back
function balanceDetails(
  balance: RestResponsesRaw.CreditBalance,
  boughtKey: 'credits.bought' | 'credits.given_by_members',
  language: string,
  translate: Awaited<ReturnType<typeof getTranslator>>['translate'],
): string {
  if (!balance.weekly && !balance.refill_left) {
    return translate('credits.none');
  }
  return displayDetailsLine([
    (balance.weekly) ? translate('credits.weekly', {
      left: balance.weekly_left.toLocaleString(language),
      weekly: balance.weekly.toLocaleString(language),
    }) : null,
    (balance.refill_left) ? translate(boughtKey, {count: balance.refill_left.toLocaleString(language)}) : null,
    (balance.weekly) ? translate('credits.resets', {time: displayTimestamp(balance.resets_at)}) : null,
  ]);
}

export async function createPayload(
  context: Command.Context | Interaction.InteractionContext,
  response: RestResponsesRaw.FetchPremiumCredits,
): Promise<DisplayPayload> {
  const { language, translate } = await getTranslator(context);

  const description: Array<string> = [
    Markup.bold(translate('credits.yours')),
    (response.user) ? balanceDetails(response.user, 'credits.bought', language, translate) : translate('credits.unlimited'),
  ];
  // group dms count as servers too, plain dms have none
  if (response.server && getPremiumServerId(context)) {
    description.push(
      '',
      Markup.bold(translate('credits.this_server')),
      balanceDetails(response.server, 'credits.given_by_members', language, translate),
    );
    // its own week, only when a slot gives it one. what members gave is listed above, the voices spend it after
    if (response.server_voices?.weekly) {
      description.push(
        '',
        Markup.bold(translate('credits.this_server_voices')),
        balanceDetails({...response.server_voices, refill_left: 0}, 'credits.given_by_members', language, translate),
      );
    }
  }

  return {
    color: EmbedColors.DEFAULT,
    description: description.join('\n'),
    ephemeral: true,
    footer: translate('credits.footer', {cost: CREDITS_AI_MESSAGE.toLocaleString(language), tts: CREDITS_PER_TTS_BYTE.toLocaleString(language)}),
    title: translate('credits.title'),
  };
}

// the small line under a reply when it used up most of the week's credits (the api sends each at most once a week)
export function formatCreditsAlert(
  alert: RestResponsesRaw.CreditsAlert,
  language: string,
  translate: Translator['translate'],
): string {
  const server = alert.scope === 'server';
  const variables = {
    left: alert.weekly_left.toLocaleString(language),
    refill: (alert.refill_left || 0).toLocaleString(language),
    time: displayTimestamp(alert.resets_at),
    weekly: alert.weekly.toLocaleString(language),
  };
  if (server && alert.voices) {
    return `-# ${translate((alert.kind === 'weekly_out') ? 'credits.alert.weekly_out_server_voices' : 'credits.alert.weekly_used_server_voices', variables)}`;
  }
  if (alert.kind === 'weekly_out') {
    return `-# ${translate((server) ? 'credits.alert.weekly_out_server' : 'credits.alert.weekly_out', variables)}`;
  }
  return `-# ${translate((server) ? 'credits.alert.weekly_used_server' : 'credits.alert.weekly_used', variables)}`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await fetchPremiumCredits(context);
  return displayReply(context, await createPayload(context, response));
}
