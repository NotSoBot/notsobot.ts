import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceSwap } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.swap';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  faces?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { faces, ...rest } = args;
  return mediaIVManipulationFaceSwap(context, {
    maxFaces: faces,
    safe: DefaultParameters.safe(context),
    ...rest,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
