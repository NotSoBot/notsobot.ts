import { Command, Interaction } from 'detritus-client';

import { imageManipulationMirrorRight } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.mirror.right';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationMirrorRight(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response, 'mirror-right');
}
