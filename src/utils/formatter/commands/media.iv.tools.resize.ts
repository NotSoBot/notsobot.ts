import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVToolsResize } from '../../../api';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.resize';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  kernel?: string,
  ratio?: boolean,
  scale?: number,
  size?: string,
  sizeorscale?: Parameters.SizeOrScale,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVToolsResize(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    scale: args.scale || (args.sizeorscale && args.sizeorscale.scale),
    size: args.size || (args.sizeorscale && args.sizeorscale.size),
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
