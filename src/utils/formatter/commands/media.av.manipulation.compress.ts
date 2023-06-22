import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationCompress } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.compress';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVManipulationCompress(context, args);
  return mediaReply(context, response);
}
