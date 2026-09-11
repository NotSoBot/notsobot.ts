import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationExtractMedia } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.extract.media';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAIVManipulationExtractMedia(context, {
    url: args.url,
  });
  return jobReply(context, response);
}
