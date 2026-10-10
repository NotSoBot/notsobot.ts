import { Command, Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'ping';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const { gateway, rest } = await context.client.ping();
  return editOrReply(context, `pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
}
