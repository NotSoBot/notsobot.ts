import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioPaulstretch } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.paulstretch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  resolution?: number,
  stretch?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioPaulstretch(context, {
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
