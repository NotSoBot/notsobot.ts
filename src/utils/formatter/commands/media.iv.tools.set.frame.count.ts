import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsSetFrameCount } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.set.framecount';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  count: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsSetFrameCount(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
