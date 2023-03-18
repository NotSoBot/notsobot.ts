import { Command, Interaction } from 'detritus-client';

import { imageToolsGifSpeed } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.gif.speed';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  speed: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageToolsGifSpeed(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
