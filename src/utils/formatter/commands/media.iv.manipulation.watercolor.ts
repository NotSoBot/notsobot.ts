import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWatercolor } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.watercolor';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  contrast?: number,
  edge?: number,
  mixing?: number,
  smoothing?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWatercolor(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
