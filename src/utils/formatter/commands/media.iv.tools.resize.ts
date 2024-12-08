import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsResize } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.resize';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  convert?: string,
  ratio?: boolean,
  scale?: number,
  size?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsResize(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
