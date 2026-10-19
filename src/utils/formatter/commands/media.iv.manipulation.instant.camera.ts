import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationInstantCamera } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.instant.camera';
export const IS_PIPEABLE = true;

export const MAX_CAPTION_LENGTH = 40;

export interface CommandArgs {
  text?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationInstantCamera(context, {
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
