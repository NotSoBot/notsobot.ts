import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMandalaScope } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.mandalascope';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  rotation?: number,
  scale?: number,
  translation?: number,
  url: string,
  zoom?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMandalaScope(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
