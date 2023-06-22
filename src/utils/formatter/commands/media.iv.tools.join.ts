import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsJoin } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.tools.join';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  loop?: boolean,
  noresize?: boolean,
  urls: Array<string>,
  vertical?: boolean,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsJoin(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
