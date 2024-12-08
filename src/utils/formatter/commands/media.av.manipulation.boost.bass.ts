import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationBoostBass } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.boost.bass';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationBoostBass(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
