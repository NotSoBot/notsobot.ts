import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagine } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.imagine';
// evan built the original ai imagine command, running it on his mac mini
export const CREDITS = [{id: '188836645670223872', name: 'evan'}];

export interface CommandArgs {
  model?: string,
  query: string,
  seed?: number,
  steps?: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLImagine(context, {
    ...args,
    safe: true,
  });
  return jobReply(context, response);
}
