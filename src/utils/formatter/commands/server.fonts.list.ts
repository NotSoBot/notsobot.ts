import { Command, Interaction } from 'detritus-client';

import * as FontsList from './fonts.list';


// `/server fonts list`, the server's side of `fonts list`
export const COMMAND_ID = 'server.fonts.list';

export interface CommandArgs {

}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return FontsList.createMessage(context, {...args, server: true});
}
