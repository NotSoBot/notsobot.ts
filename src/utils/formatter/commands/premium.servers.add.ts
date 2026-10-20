import { Command, Interaction } from 'detritus-client';

import PremiumServersStore, { getPremiumServerId } from '../../../stores/premiumservers';
import UserStore from '../../../stores/users';
import { getTranslator } from '../../i18n';

import { putUserPremiumServer } from '../../../api';
import { getApiError } from '../../../api/errors';
import { ApiErrorCodes, StatusEmojis } from '../../../constants';
import { displayReply } from '../../../utils';

import { createPayload } from './premium.servers';


export const COMMAND_ID = 'premium.servers.add';

export interface CommandArgs {

}

// gives the server (or group dm) it's used in the user's premium, they have to be in it to use it here
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const warn = (description: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`, ephemeral: true});

  const serverId = getPremiumServerId(context);
  if (!serverId) {
    return warn(translate('premium_servers.only_in_a_server'));
  }

  const user = await UserStore.getOrFetch(context, context.userId);
  if (!user || !user.isPremiumPlus) {
    return warn(translate('premium_servers.premium_plus_required'));
  }

  let response;
  try {
    response = await putUserPremiumServer(context, context.userId, serverId);
  } catch(error) {
    const information = await getApiError(error);
    if (information) {
      switch (information.code) {
        case ApiErrorCodes.MAX_PREMIUM_SERVERS: {
          return warn(translate('premium_servers.max_reached', {max: String(information.limit)}));
        };
        case ApiErrorCodes.PREMIUM_REQUIRED: {
          return warn(translate('premium_servers.premium_plus_required'));
        };
      }
    }
    throw error;
  }

  // the api event updates every cluster, this one shouldn't wait on it
  if (response.created) {
    const userIds = PremiumServersStore.get(serverId);
    PremiumServersStore.insert(serverId, [...(userIds || []), context.userId]);
  }

  const payload = await createPayload(context, response);
  payload.description = [
    `${StatusEmojis.YES} ${translate((response.created) ? 'premium_servers.added_here' : 'premium_servers.already_here')}`,
    '',
    payload.description,
  ].join('\n');
  return displayReply(context, payload);
}
