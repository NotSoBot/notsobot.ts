import { Command, Interaction } from 'detritus-client';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'privacy';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  return editOrReply(context, '<https://beta.notsobot.com/legal/privacy>');
}
