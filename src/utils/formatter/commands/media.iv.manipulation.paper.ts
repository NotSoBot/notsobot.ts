import { Command, Interaction } from 'detritus-client';

import { imageManipulationPaper } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.manipulation.paper';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationPaper(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
