import { Command, Interaction } from 'detritus-client';

import { imageToolsConvert } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.tools.convert';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  size?: string,
  to: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageToolsConvert(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
