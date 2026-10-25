import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationBounce } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.bounce';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  axis?: string,
  bounces?: number,
  duration?: number,
  minimum?: number,
  style?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationBounce(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

// the result's frames change size, `mediaReply` adds the paste-the-link notice for it (from its metadata)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
