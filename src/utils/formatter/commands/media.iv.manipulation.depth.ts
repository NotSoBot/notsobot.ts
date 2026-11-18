import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDepth } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.depth';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'depth -colormap turbo',
  inputs: ['video2'],
  script: [
    'load FILE_1 img',
    'depthmap img turbo',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  colormap?: string,
  invert?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDepth(context, {
    colormap: args.colormap,
    invert: args.invert,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('depthmap', chain.key, {
    colormap: args.colormap,
    invert: args.invert,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
