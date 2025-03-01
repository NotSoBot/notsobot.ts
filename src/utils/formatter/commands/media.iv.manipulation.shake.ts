import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationShake } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.shake';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  horizontal?: number,
  url: string,
  vertical?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationShake(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
