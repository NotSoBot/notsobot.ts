import { Command, Interaction } from 'detritus-client';

import { audioToolsPutConcat } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'audio.tools.put.concat';

export interface CommandArgs {
  audioUrl: string,
  longest?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutConcat(context, {
    audioUrl: args.audioUrl,
    longest: args.longest,
    url: args.url,
  });
  return mediaReply(context, response);
}
