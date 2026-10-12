import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationGlitch } from '../../../api';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.glitch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  notransparency?: boolean,
  seed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationGlitch(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    keepTransparency: !args.notransparency,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
