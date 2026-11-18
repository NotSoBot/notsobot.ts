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
  type?: string,
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
    // the types are the mediascript lines of the same name, force is `resize`. `type` wins over `ratio` like the route
    const type = args.type || ((args.ratio) ? 'contain' : 'force');
    const action = (type === 'force') ? 'resize' : type;
    // force keeps the aspect ratio for one number (or a -1) and mediascript's resize can't, the other types use one
    // number as a square box (the route's -1 height is the width) so it's both sides
    const parts = size.replace(/\(|\)/g, '').replace(/x/g, ',').split(',');
    if (parts.length === 1 && type !== 'force') {
      parts.push(parts[0]);
    }
    const [width, height] = parts.map((x) => Number(x.trim()));
    if (parts.length < 2 || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return null;
    }
    return Mediascript.line(action, chain.key, {width, height, kernel: args.kernel});
  }
  if (args.type && args.type !== 'force') {
    // the route's error, fit/contain/cover/pad need a size
    return null;
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
