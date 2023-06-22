import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsConcat } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.aiv.tools.concat';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  urls: Array<string>,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVToolsConcat(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
