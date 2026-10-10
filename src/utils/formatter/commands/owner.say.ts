import { Command, Interaction } from 'detritus-client';


export interface CommandArgs {
  text: string,
}


export const COMMAND_ID = 'say';

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  if (context instanceof Command.Context) {
    return context.reply(args.text);
  }
  return context.editOrRespond(args.text);
}
