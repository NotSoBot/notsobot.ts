import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationZoomBlur } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.zoom.blur';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  expand?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationZoomBlur(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
