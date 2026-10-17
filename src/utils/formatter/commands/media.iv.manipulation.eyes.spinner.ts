import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEyes } from '../../../api';
import { MediaEyeTypes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.eyes.spinner';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEyes(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    type: MediaEyeTypes.SPINNER,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
