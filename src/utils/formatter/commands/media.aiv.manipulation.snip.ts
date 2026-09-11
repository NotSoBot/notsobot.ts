import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationSnip } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


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
  const response = await mediaAIVManipulationSnip(context, {
    audioOnly: args.audio,
    end: (args.end) ? (args.end * 1000) : args.end,
    safe: DefaultParameters.safe(context),
    start: (args.start) ? (args.start * 1000) : args.start,
    url: args.url,
  });
  return jobReply(context, response);
}
