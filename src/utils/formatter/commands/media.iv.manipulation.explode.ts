import { Command, Interaction } from 'detritus-client';

import { imageManipulationExplode } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.explode';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationExplode(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
