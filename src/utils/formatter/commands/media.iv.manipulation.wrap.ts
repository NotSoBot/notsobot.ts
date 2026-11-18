import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWrap } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.wrap';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'wrap',
  inputs: ['photo'],
  script: [
    'load FILE_1 img',
    'text logo NotSoBot SIZE=96 COLOR=#d01818 FONT=impact',
    'wrap img logo 0.5 0.85 0.45',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  light?: number,
  noclip?: boolean,
  relief?: number,
  rotate?: number,
  size?: number,
  urls: Array<string>,
  x?: number,
  y?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // the first media is the surface (always a still of it), the second one goes onto it (an animated one plays on it)
  return mediaIVManipulationWrap(context, {
    clip: (args.noclip) ? false : undefined,
    light: args.light,
    relief: args.relief,
    rotate: args.rotate,
    safe: DefaultParameters.safe(context),
    size: args.size,
    urls: args.urls,
    x: args.x,
    y: args.y,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the route takes exactly two medias, anything else gets its error from the job-per-step pipe
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  const overlay = chain.load(args.urls[1]);
  return Mediascript.line('wrap', chain.key, overlay, {
    x: args.x,
    y: args.y,
    size: args.size,
    rotate: args.rotate,
    relief: args.relief,
    light: args.light,
    clip: (args.noclip) ? false : undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
