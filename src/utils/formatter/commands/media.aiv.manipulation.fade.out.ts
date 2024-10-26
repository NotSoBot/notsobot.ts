import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationFadeOut } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.fade.out';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  color?: string,
  duration?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationFadeOut(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
