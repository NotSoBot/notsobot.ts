import { Command, Interaction } from 'detritus-client';

import { imageManipulationTrace } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.manipulation.trace';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationTrace(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
