import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsSetFPS } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.tools.set.fps';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  fps: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsSetFPS(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
