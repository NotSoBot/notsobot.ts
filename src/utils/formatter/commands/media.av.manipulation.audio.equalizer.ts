import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioEqualizer } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.equalizer';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  air?: number,
  bass?: number,
  highMids?: number,
  lowMids?: number,
  mids?: number,
  subBass?: number,
  treble?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioEqualizer(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
