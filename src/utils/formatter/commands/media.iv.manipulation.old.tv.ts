import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOldTV } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.old.tv';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  grayscale?: boolean,
  still?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOldTV(context, {
    safe: DefaultParameters.safe(context),
    animated: (args.still) ? false : undefined,
    grayscale: args.grayscale,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
