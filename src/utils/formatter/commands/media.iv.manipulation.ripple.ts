import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationRipple } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.ripple';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amplitude?: number,
  offset?: number,
  power?: number,
  rmin?: number,
  type?: string,
  url: string,
  width?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationRipple(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
