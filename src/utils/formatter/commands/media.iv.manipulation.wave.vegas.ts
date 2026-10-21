import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWaveVegas } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wave.vegas';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
  xFrequency?: number,
  xIntensity?: number,
  xPhase?: number,
  xSpeed?: number,
  yFrequency?: number,
  yIntensity?: number,
  yPhase?: number,
  ySpeed?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWaveVegas(context, {
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
