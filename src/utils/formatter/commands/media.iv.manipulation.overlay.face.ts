import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFace } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.overlay.face';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  urls: Array<string>,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayFace(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
