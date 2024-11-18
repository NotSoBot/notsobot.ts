import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsRotate3d } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.rotate.3d';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  cropMode?: string,
  pan?: number,
  roll?: number,
  tilt?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsRotate3d(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
