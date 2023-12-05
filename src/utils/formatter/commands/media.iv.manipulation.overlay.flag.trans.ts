import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFlagTrans } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.flag.trans';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayFlagTrans(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
