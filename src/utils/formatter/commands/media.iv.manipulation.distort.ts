import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDistort } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.distort';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  arguments?: Array<number>,
  method: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDistort(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
