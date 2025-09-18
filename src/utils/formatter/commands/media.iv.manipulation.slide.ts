import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationSlide } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.slide';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  direction?: string,
  speed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSlide(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
