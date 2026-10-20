import { Command, Interaction } from 'detritus-client';

import PremiumServersStore, { getPremiumServerId } from '../../../stores/premiumservers';
import { getTranslator } from '../../i18n';

import { deleteUserPremiumServer, fetchUserPremiumServers } from '../../../api';
import { getApiError } from '../../../api/errors';
import { ApiErrorCodes, StatusEmojis } from '../../../constants';
import { displayReply, displayTimestamp } from '../../../utils';

import { createPayload } from './premium.servers';


export const COMMAND_ID = 'premium.servers.remove';

export interface CommandArgs {
  // its number from the list, or its id. the server it's used in when not given
  server?: null | string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { translate } = await getTranslator(context);

  const warn = (description: string) => displayReply(context, {description: `${StatusEmojis.WARNING} ${description}`, ephemeral: true});

  const { items } = await fetchUserPremiumServers(context, context.userId);

  let serverId: null | string = null;
  const value = (args.server || '').trim();
  if (value) {
    const position = parseInt(value);
    if (String(position) === value && 1 <= position && position <= items.length) {
      serverId = items[position - 1].server_id;
    } else {
      serverId = value;
    }
  } else {
    serverId = getPremiumServerId(context);
  }

  if (!serverId || !items.some((item) => item.server_id === serverId)) {
    return warn(translate('premium_servers.unknown_server'));
  }

  let response;
  try {
    response = await deleteUserPremiumServer(context, context.userId, serverId);
  } catch(error) {
    const information = await getApiError(error);
    if (information) {
      switch (information.code) {
        case ApiErrorCodes.PREMIUM_SERVER_COOLDOWN: {
          return warn(translate('premium_servers.cooldown', {time: displayTimestamp(String(information.removable_at))}));
        };
        case ApiErrorCodes.UNKNOWN_PREMIUM_SERVER: {
          return warn(translate('premium_servers.unknown_server'));
        };
      }
    }
    throw error;
  }

  // the api event updates every cluster, this one shouldn't wait on it
  const userIds = PremiumServersStore.get(serverId);
  if (userIds) {
    PremiumServersStore.insert(serverId, Array.from(userIds).filter((userId) => userId !== context.userId));
  }

  const payload = await createPayload(context, response);
  payload.description = [
    `${StatusEmojis.YES} ${translate('premium_servers.removed')}`,
    '',
    payload.description,
  ].join('\n');
  return displayReply(context, payload);
}
