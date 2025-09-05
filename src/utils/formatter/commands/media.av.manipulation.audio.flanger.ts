import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioFlanger } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.flanger';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  delay?: number,
  depth?: number,
  phase?: number,
  regen?: number,
  speed?: number,
  url: string,
  width?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioFlanger(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
