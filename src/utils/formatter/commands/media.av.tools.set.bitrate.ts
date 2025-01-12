import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsSetBitRate } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.av.tools.set.bitrate';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  audio?: number,
  url: string,
  video?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVToolsSetBitRate(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
