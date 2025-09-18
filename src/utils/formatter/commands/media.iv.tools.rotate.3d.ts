import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsRotate3d } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.rotate.3d';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  cropMode?: string,
  order?: string,
  pan?: number,
  roll?: number,
  tilt?: number,
  url: string,
  zoom?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsRotate3d(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
