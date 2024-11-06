import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftHSV } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.hsv';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  brightness?: number,
  hue?: number,
  saturation?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftHSV(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
