import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsExtractAudio } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.tools.extract.audio';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVToolsExtractAudio(context, {
    url: args.url,
  });
  return mediaReply(context, response);
}
