import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFace } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.face';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  scale?: number,
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
  return mediaReply(context, response);
}
