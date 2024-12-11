import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMotionBlur } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.motion.blur';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  strength?: number,
  url: string,
  vertical?: boolean,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMotionBlur(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
