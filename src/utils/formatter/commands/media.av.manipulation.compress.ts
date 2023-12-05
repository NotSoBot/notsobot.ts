import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationCompress } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.compress';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationCompress(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
