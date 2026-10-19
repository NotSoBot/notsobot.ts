import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceFeaturesSwap } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.features.swap';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  mode?: string,
  multiplier?: number,
  regions?: string,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceFeaturesSwap(context, {
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
