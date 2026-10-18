import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioBitcrush } from '../../../api';
import { MediaAudioBitcrushModes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.bitcrush';
export const IS_PIPEABLE = true;

export const DEFAULT_MODE = MediaAudioBitcrushModes.LOG;

export interface CommandArgs {
  bits?: number,
  mix?: number,
  mode?: MediaAudioBitcrushModes,
  samples?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioBitcrush(context, {
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
