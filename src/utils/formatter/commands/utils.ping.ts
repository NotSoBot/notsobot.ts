import { Command, Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';
import { getTranslator } from '../../i18n';


export const COMMAND_ID = 'ping';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { language, translate, translateMaybe } = await getTranslator(context);
  const { gateway, rest } = await context.client.ping();
  return editOrReply(context, translate('utils_ping.pong_gateway_ms_rest_ms', {gateway: gateway, rest: rest}));
}
