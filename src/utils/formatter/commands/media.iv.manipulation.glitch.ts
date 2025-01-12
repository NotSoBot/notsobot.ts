import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationGlitch } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.glitch';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  iterations?: number,
  notransparency?: boolean,
  seed?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationGlitch(context, {
    amount: args.amount,
    file: args.file,
    iterations: args.iterations,
    keepTransparency: !args.notransparency,
    seed: args.seed,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return mediaReply(context, response);
}
