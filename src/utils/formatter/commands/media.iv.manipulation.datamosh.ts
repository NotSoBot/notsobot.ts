import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDatamosh } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.datamosh';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  chance?: number,
  repeat?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDatamosh(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
