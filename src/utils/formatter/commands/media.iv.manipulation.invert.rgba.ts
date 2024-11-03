import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationInvertRGBA } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.invert.rgba';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  alpha?: number,
  blue?: number,
  green?: number,
  red?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationInvertRGBA(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
