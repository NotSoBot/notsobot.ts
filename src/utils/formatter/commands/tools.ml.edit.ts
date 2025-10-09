import { Command, Interaction } from 'detritus-client';

import { utilitiesMLEdit } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.edit';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  model?: string,
  query: string,
  safe?: boolean,
  seed?: number,
  steps?: number,
  strength?: number,
  url: string, 
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return utilitiesMLEdit(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
