import { Command, Interaction } from 'detritus-client';

import { audioToolsPutMix } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'audio.tools.put.mix';

export interface CommandArgs {
  audioUrl: string,
  longest?: boolean,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await audioToolsPutMix(context, {
    audioUrl: args.audioUrl,
    longest: args.longest,
    url: args.url,
  });
  return mediaReply(context, response);
}
