import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationVolume } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.volume';

export interface CommandArgs {
  url: string,
  volume: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVManipulationVolume(context, {
    url: args.url,
    volume: args.volume,
  });
  return mediaReply(context, response);
}
