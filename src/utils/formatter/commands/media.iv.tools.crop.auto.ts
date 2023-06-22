import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsCropAuto } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.crop';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsCropAuto(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
