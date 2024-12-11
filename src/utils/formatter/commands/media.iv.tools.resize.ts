import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVToolsResize } from '../../../api';
import { Parameters, mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.resize';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  convert?: string,
  ratio?: boolean,
  scale?: number,
  size?: string,
  sizeorscale?: Parameters.SizeOrScale,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVToolsResize(context, {
    convert: args.convert,
    file: args.file,
    ratio: args.ratio,
    scale: args.scale || (args.sizeorscale && args.sizeorscale.scale),
    size: args.size || (args.sizeorscale && args.sizeorscale.size),
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
