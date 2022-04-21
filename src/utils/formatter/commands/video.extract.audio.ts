import { Command, Interaction } from 'detritus-client';

import { videoToolsExtractAudio } from '../../../api';
import { mediaReply } from '../../../utils';


export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await videoToolsExtractAudio(context, {
    url: args.url,
  });
  return mediaReply(context, response);
}
