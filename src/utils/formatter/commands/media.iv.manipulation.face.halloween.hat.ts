import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceHalloweenHat } from '../../../api';
import { MediaFaceHalloweenHats } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.halloween.hat';
export const IS_PIPEABLE = true;

export const DEFAULT_HAT = MediaFaceHalloweenHats.WITCH;

export interface CommandArgs {
  hat?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceHalloweenHat(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
