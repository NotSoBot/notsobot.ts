import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsReverse } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.reverse';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVToolsReverse(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
