import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioMultiPitch } from '../../../api';
import { MediaAudioMultiPitchEngines } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.multipitch';
export const IS_PIPEABLE = true;
// made the multipitch program this is based on
export const CREDITS = [{id: '917183936940113931', name: 'beebo_robot64'}];

export const DEFAULT_ENGINE = MediaAudioMultiPitchEngines.BUNGEE;

export interface CommandArgs {
  engine?: MediaAudioMultiPitchEngines,
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
