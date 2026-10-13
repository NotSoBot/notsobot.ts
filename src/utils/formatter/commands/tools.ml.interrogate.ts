import { Command, Interaction } from 'detritus-client';

import { utilitiesMLInterrogate } from '../../../api';
import { displayReply } from '../..';


export const COMMAND_ID = 'tools.ml.interrogate';

export interface CommandArgs {
  model?: string,
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLInterrogate(context, args);
  return displayReply(context, {description: response.prompt});
}
