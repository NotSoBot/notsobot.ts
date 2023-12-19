import { Command, Interaction } from 'detritus-client';

import { utilitiesMLInterrogate } from '../../../api';
import { editOrReply } from '../..';


export const COMMAND_ID = 'tools.ml.interrogate';

export interface CommandArgs {
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLInterrogate(context, args);
  return editOrReply(context, response.prompt);
}
