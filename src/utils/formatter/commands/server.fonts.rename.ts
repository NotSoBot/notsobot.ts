import { Command, Interaction } from 'detritus-client';

import * as FontsRename from './fonts.rename';


// `/server fonts rename`, the server's side of `fonts rename`
export const COMMAND_ID = 'server.fonts.rename';

export interface CommandArgs {
  name: string,
  newName: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return FontsRename.createMessage(context, {...args, server: true});
}
