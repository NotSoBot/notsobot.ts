import { Command, Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';


export const COMMAND_ID = 'privacy';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
) {
  const isFromInteraction = (context instanceof Interaction.InteractionContext);
  return editOrReply(context, {
    content: '<https://notsobot.com/legal/privacy>',
    flags: (isFromInteraction) ? MessageFlags.EPHEMERAL : undefined,
  });
}
