import { Command, Interaction } from 'detritus-client';

import * as FontsRemove from './fonts.remove';


// `/server fonts remove`, the server's side of `fonts remove`
export const COMMAND_ID = 'server.fonts.remove';

export interface CommandArgs {
  name: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return FontsRemove.createMessage(context, {...args, server: true});
}
