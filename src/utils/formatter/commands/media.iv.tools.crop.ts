import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsCrop } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  height: string,
  width: string,
  x?: string,
  y?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsCrop(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
