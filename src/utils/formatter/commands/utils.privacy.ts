import { Command, Interaction } from 'detritus-client';

import { displayReply } from '../../../utils';


export const COMMAND_ID = 'legal.privacy';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  return displayReply(context, {description: '<https://notsobot.com/legal/privacy>', ephemeral: true});
}
