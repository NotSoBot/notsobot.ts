import { Command, Interaction } from 'detritus-client';

import { utilitiesMLInterrogate } from '../../../api';
import { editOrReply } from '../..';


export const COMMAND_ID = 'tools.ml.interrogate';

export interface CommandArgs {
  debug?: boolean,
  model?: string,
  url: string, 
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLInterrogate(context, args);
  if (args.debug) {
    return editOrReply(context, {
      content: response.prompt,
      file: {filename: 'scan.json', value: JSON.stringify(response, null, 2)},
    });
  }
  return editOrReply(context, response.prompt);
}
