import { Command, Interaction } from 'detritus-client';

import { imageManipulationGlitch } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.glitch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  seed?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationGlitch(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
