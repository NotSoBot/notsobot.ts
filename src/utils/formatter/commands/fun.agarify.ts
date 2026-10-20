import { Command, Interaction } from 'detritus-client';

import * as FunAgar from './fun.agar';


export const COMMAND_ID = 'fun.agarify';

export interface CommandArgs {
  text: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // agar with a random clan tag in front
  return FunAgar.createMessage(context, args, {clan: true});
}
