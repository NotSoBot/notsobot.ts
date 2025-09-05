import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioTremolo } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.tremolo';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  depth?: number,
  frequency?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioTremolo(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
