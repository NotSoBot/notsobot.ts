import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationFadeOut } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.fade.out';
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
  return mediaAIVManipulationFadeOut(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
