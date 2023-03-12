import { Command, Interaction } from 'detritus-client';

import { imageManipulationMagikGif } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.magik.gif';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationMagikGif(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
