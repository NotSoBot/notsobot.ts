import { Command, Interaction } from 'detritus-client';

import { imageToolsCrop } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.crop';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  size?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageToolsCrop(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
