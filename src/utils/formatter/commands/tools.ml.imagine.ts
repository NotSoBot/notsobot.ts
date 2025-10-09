import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagine } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.imagine';

export interface CommandArgs {
  model?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLImagine(context, args);
  return jobReply(context, response);
}
