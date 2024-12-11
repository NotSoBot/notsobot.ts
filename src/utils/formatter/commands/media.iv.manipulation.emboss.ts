import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEmboss } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.emboss';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  azimuth?: number,
  compose?: string,
  elevation?: number,
  depth?: number,
  intensity?: number,
  gray?: number,
  method?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEmboss(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
