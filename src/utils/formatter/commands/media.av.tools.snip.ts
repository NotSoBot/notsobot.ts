import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsSnip } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.av.tools.snip';

export interface CommandArgs {
  audio?: boolean,
  end?: number,
  start?: number,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await mediaAVToolsSnip(context, {
    audioOnly: args.audio,
    end: (args.end) ? args.end * 1000 : args.end,
    start: (args.start) ? args.start * 1000 : args.start,
    url: args.url,
  });
  return mediaReply(context, response);
}
