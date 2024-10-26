import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSwapRGBA } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.swap.rgba';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  channels?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSwapRGBA(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
