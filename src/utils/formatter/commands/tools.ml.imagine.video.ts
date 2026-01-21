import { Command, Interaction } from 'detritus-client';

import { utilitiesMLImagineVideo } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'tools.ml.imagine.video';

export interface CommandArgs {
  query: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await utilitiesMLImagineVideo(context, args);
  return jobReply(context, response);
}
