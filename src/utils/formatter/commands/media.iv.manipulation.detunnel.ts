import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDetunnel } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.detunnel';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  spiral?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDetunnel(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
