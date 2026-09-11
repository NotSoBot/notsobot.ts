import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationFadeIn } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.fade.in';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  color?: string,
  duration?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationFadeIn(context, {
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
