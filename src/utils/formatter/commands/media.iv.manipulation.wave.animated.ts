import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWaveAnimated } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.wave.animated';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amplitude?: number,
  speed?: number,
  url: string,
  waveLength?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWaveAnimated(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
