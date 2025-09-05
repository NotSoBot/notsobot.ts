import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationAndroid } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.android';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationAndroid(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
