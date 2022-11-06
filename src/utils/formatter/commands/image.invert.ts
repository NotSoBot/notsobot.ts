import { Command, Interaction } from 'detritus-client';

import { imageManipulationInvert } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.invert';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationInvert(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
