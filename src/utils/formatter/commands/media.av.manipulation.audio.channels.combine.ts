import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioChannelsCombine } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.audio.channels.combine';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioChannelsCombine(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
