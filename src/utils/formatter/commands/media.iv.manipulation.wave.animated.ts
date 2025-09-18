import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWaveAnimated } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wave.animated';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amplitude?: number,
  speed?: number,
  url: string,
  waveLength?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWaveAnimated(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
