import { Command, Interaction } from 'detritus-client';

import { imageManipulationBlurple } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.blurple';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationBlurple(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
