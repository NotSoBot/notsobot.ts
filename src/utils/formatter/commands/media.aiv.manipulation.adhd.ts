import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationADHD } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.manipulation.adhd';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  horizontal?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationADHD(context, {
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
