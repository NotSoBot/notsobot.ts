import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioReverb } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.reverb';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  decay?: number,
  delay?: number,
  url: string,
  volume?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioReverb(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
