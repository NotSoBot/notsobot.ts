import { Command, Interaction } from 'detritus-client';

import { imageManipulationSharpen } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.sharpen';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationSharpen(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
