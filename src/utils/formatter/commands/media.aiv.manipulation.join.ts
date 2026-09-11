import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationJoin } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.join';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  noloop?: boolean,
  noresize?: boolean,
  urls: Array<string>,
  vertical?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationJoin(context, {
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
