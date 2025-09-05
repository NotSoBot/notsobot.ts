import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioPitch } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.pitch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioPitch(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
