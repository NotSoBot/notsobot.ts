import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWave } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wave';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amplitude?: number,
  url: string,
  waveLength?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWave(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
