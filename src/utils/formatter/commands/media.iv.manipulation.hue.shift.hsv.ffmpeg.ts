import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftHSVFFMPEG } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.hsv.ffmpeg';
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
  return mediaIVManipulationHueShiftHSVFFMPEG(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
