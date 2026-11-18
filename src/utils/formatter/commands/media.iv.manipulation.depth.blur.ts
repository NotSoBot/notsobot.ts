import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDepthBlur } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.depth.blur';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'portrait',
  inputs: ['video2'],
  script: [
    'load FILE_1 img',
    'depthblur img',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  range?: number,
  x?: number,
  y?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDepthBlur(context, {
    amount: args.amount,
    range: args.range,
    x: args.x,
    y: args.y,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('depthblur', chain.key, {
    amount: args.amount,
    range: args.range,
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
