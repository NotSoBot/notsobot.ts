import { Command, Interaction } from 'detritus-client';

import { mediaIManipulationFaceAnime } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.anime';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIManipulationFaceAnime(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
