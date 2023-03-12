import { Command, Interaction } from 'detritus-client';

import { imageManipulationJPEG } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.needsmorejpeg';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  quality?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationJPEG(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
