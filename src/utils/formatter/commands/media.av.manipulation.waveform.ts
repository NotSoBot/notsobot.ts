import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationWaveform } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.waveform';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  color?: string,
  split?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationWaveform(context, {
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
