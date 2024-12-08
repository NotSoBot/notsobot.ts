import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsRotate } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.rotate';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  crop?: boolean,
  degrees?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsRotate(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
