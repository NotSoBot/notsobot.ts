import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPhoSimp } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.phosimp';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  filters: Array<number>,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationPhoSimp(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
