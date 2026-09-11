import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationOverlay } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.overlay';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  blend?: number,
  color?: string,
  noloop?: boolean,
  opacity?: number,
  resize?: string,
  similarity?: number,
  urls: Array<string>,
  x?: string,
  y?: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationOverlay(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
