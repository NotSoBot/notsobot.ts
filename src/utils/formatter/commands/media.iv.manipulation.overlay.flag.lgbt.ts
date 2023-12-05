import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFlagLGBT } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.flag.lgbt';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayFlagLGBT(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
