import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFlagUK } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.flag.uk';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayFlagUK(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
