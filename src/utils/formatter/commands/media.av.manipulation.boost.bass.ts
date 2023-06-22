import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationBoostBass } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.manipulation.boost.bass';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVManipulationBoostBass(context, {
    url: args.url,
  });
  return mediaReply(context, response);
}
