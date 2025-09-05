import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVolume } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.volume';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
  volume: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioVolume(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
