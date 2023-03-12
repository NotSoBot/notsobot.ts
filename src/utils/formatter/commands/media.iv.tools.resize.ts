import { Command, Interaction } from 'detritus-client';

import { imageToolsResize } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.resize';
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
  return imageToolsResize(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
