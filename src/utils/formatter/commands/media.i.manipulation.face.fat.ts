import { Command, Interaction } from 'detritus-client';

import { mediaIManipulationFaceFat } from '../../../api';
import { MediaFaceFatSizes } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.fat';
export const IS_PIPEABLE = true;

export const DEFAULT_SIZE = MediaFaceFatSizes.XXXL;

export interface CommandArgs {
  size?: string,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIManipulationFaceFat(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
