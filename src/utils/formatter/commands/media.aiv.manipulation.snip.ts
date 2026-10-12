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

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationSnip(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    audioOnly: args.audio,
    end: (args.end) ? (args.end * 1000) : args.end,
    start: (args.start) ? (args.start * 1000) : args.start,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
