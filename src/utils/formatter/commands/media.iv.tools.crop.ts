import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsCrop } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  height: string,
  width: string,
  x?: string,
  y?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsCrop(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
