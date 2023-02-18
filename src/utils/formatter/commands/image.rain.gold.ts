import { Command, Interaction } from 'detritus-client';

import { imageManipulationRainGold } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.rain.gold';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageManipulationRainGold(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
