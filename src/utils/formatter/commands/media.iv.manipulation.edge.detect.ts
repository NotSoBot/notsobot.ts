import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEdgeDetect } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.edge.detect';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  invert?: boolean,
  method?: string,
  mix?: number,
  strength?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEdgeDetect(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
