import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDepthParallax } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.depth.parallax';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: '3dphoto',
  inputs: ['video2'],
  script: [
    'load FILE_1 img',
    'parallax img',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  duration?: number,
  motion?: string,
  x?: number,
  y?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDepthParallax(context, {
    amount: args.amount,
    duration: args.duration,
    motion: args.motion,
    x: args.x,
    y: args.y,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('parallax', chain.key, {
    motion: args.motion,
    amount: args.amount,
    duration: args.duration,
    x: args.x,
    y: args.y,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
