import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVibrato } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.audio.vibrato';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  depth?: number,
  frequency?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioVibrato(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
