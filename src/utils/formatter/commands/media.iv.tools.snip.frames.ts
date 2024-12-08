import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsSnipFrames } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.snip.frames';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  end?: number,
  start?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsSnipFrames(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
