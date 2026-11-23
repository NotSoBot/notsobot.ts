import { Command, Interaction } from 'detritus-client';

import { utilitiesMLInterrogate } from '../../../api';
import { MLInterrogateModels } from '../../../constants';
import { displayReply } from '../..';


export const COMMAND_ID = 'tools.ml.interrogate';

export interface CommandArgs {
  model?: MLInterrogateModels,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLInterrogate(context, {model: args.model, url: args.url});
  return displayReply(context, {description: response.prompt});
}
