import { Command, Interaction } from 'detritus-client';

import { imageToolsRotate } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.rotate';
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
  return imageToolsRotate(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
