import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationAudioPutConcat } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.a.tools.put.concat';

export interface CommandArgs {
  longest?: boolean,
  noloop?: boolean,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  args.urls = args.urls.reverse();
  return mediaAIVManipulationAudioPutConcat(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
