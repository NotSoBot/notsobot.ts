import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioReverse } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.reverse';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioReverse(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
