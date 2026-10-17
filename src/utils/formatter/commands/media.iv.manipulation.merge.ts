import { Command, Interaction } from 'detritus-client';


export const COMMAND_ID = 'media.iv.manipulation.merge';

export interface CommandArgs {
}

// not implemented yet: replies with nothing. the command isn't registered (no default export) until this does something
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {

}
