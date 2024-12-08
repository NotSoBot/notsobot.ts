import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsOverlay } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.overlay';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  blend?: number,
  color?: string,
  noloop?: boolean,
  opacity?: number,
  resize?: string,
  similarity?: number,
  urls: Array<string>,
  x?: string,
  y?: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVToolsOverlay(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
