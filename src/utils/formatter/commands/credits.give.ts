import { Command, Interaction } from 'detritus-client';

import { getPremiumServerId } from '../../../stores/premiumservers';
import { getTranslator } from '../../i18n';

import { postPremiumCreditsGive } from '../../../api';
import { getApiError } from '../../../api/errors';
import { ApiErrorCodes, EmbedColors, StatusEmojis } from '../../../constants';
import { displayDetailsLine, displayReply } from '../../../utils';


export const COMMAND_ID = 'credits.give';

export interface CommandArgs {
  amount: number,
}

// gives the server (or group dm) it's used in some of the user's bought credits, shown to everyone there
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { language, translate } = await getTranslator(context);

  const warn = (description: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`, ephemeral: true});

  if (!getPremiumServerId(context)) {
    return warn(translate('premium_servers.only_in_a_server'));
  }

  const amount = Math.floor(args.amount);
  if (!Number.isFinite(amount) || amount < 1) {
    return warn(translate('credits.not_enough', {count: '0'}));
  }

  let response;
  try {
    response = await postPremiumCreditsGive(context, amount);
  } catch(error) {
    const information = await getApiError(error);
    if (information && information.code === ApiErrorCodes.CREDITS_LIMIT) {
      const left = Number(information.refill_left) || 0;
      return warn(translate('credits.not_enough', {count: left.toLocaleString(language)}));
    }
    throw error;
  }

  return displayReply(context, {
    allowedMentions: {parse: []},
    color: EmbedColors.DEFAULT,
    description: [
      `${StatusEmojis.YES} ${translate('credits.given', {amount: response.amount.toLocaleString(language), user: `<@${context.userId}>`})}`,
      displayDetailsLine([
        translate('credits.given_by_members', {count: response.server_refill.toLocaleString(language)}),
      ], true),
    ].join('\n'),
  });
}
