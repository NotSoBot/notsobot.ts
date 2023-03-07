import { Command, Interaction } from 'detritus-client';

import { audioToolsPutReplace } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'audio.tools.put.replace';

export interface CommandArgs {
  audioUrl: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutReplace(context, {
    audioUrl: args.audioUrl,
    url: args.url,
  });
  return mediaReply(context, response);
}
