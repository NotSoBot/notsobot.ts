import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsExtractMedia } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.extract.media';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAIVToolsExtractMedia(context, {
    url: args.url,
  });
  return mediaReply(context, response);
}
