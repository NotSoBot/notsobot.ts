import { Command, Interaction } from 'detritus-client';

import { imageManipulationGlitchGif } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.manipulation.glitch';
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
  return imageManipulationGlitchGif(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
