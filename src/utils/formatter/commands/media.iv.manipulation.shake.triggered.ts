import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationShakeTriggered } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.labels.triggered';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationShakeTriggered(context, {
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
