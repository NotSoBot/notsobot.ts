import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationShuffle } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.shuffle';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  segment?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationShuffle(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
