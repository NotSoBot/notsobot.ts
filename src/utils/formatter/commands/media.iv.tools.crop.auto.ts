import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsCropAuto } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop';
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
  return mediaReply(context, response);
}
