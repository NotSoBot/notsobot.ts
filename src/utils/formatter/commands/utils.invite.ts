import { Command, Interaction } from 'detritus-client';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'invite';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  return displayReply(context, {description: '<https://notsobot.com/invite>'});
}
