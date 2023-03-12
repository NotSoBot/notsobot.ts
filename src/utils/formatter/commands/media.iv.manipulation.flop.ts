import { Command, Interaction } from 'detritus-client';

import { imageManipulationFlop } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.flop';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationFlop(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
