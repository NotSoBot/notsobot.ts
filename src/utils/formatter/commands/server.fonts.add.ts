import { Command, Interaction } from 'detritus-client';

import * as FontsAdd from './fonts.add';


// `/server fonts add`, the server's side of `fonts add`
export const COMMAND_ID = 'server.fonts.add';

export interface CommandArgs {
  name: string,
  // the font file (an attachment's or a link)
  url?: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return FontsAdd.createMessage(context, {...args, server: true});
}
