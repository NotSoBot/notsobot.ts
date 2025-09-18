import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsCropTwitterHex } from '../../../api';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop.nft';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  background?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsCropTwitterHex(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
