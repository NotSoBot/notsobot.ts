import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftRGB } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  blue?: number,
  green?: number,
  red?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftRGB(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
