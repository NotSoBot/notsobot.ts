import { Command, Interaction } from 'detritus-client';

import { createMessage as createMessageForTagCommandsList } from './tag.commands.list';


export const COMMAND_ID = 'tag.commands.list.me';

export interface CommandArgs {
  
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return createMessageForTagCommandsList(context, {showMeOnly: true});
}
