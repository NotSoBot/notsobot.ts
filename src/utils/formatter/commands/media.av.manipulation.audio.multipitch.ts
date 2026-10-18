import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioMultiPitch } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.multipitch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  normalize?: boolean,
  semitones?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioMultiPitch(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    // `0, 7, 12` works too
    semitones: args.semitones?.replace(/\s+/g, '') || undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
