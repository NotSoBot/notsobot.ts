import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorLeft } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.mirror.left';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationMirrorLeft(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response, 'mirror-left');
}
