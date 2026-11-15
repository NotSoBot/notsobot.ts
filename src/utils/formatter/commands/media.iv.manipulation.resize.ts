import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationResize } from '../../../api';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


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
  return mediaIVManipulationResize(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    scale: args.scale || (args.sizeorscale && args.sizeorscale.scale),
    size: args.size || (args.sizeorscale && args.sizeorscale.size),
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  const size = args.size || (args.sizeorscale && args.sizeorscale.size);
  if (size) {
    // only WIDTHxHEIGHT, the route keeps the aspect ratio for one number (or a -1) and mediascript's resize can't
    const parts = size.replace(/\(|\)/g, '').replace(/x/g, ',').split(',');
    const [width, height] = parts.map((x) => Number(x.trim()));
    if (parts.length < 2 || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return null;
    }
    return Mediascript.line((args.ratio) ? 'contain' : 'resize', chain.key, {width, height, kernel: args.kernel});
  }
  // the route's default scale is 2. both stop at the max size, a scale of 0 or less gets the route's own error
  const scale = args.scale || (args.sizeorscale && args.sizeorscale.scale) || 2;
  if (!(0 < scale)) {
    return null;
  }
  return Mediascript.line('scale', chain.key, {scale, kernel: args.kernel});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
