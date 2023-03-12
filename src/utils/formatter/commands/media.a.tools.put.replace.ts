import { Command, Interaction } from 'detritus-client';

import { audioToolsPutReplace } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'audio.tools.put.replace';

export interface CommandArgs {
  audioUrl: string,
  longest?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutReplace(context, {
    audioUrl: args.audioUrl,
    longest: args.longest,
    url: args.url,
  });
  return mediaReply(context, response);
}
