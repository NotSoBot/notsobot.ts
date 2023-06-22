import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationDestroy } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.destroy';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVManipulationDestroy(context, {
    url: args.url,
  });
  return mediaReply(context, response);
}
