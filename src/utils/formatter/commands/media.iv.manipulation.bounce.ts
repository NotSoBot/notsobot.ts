import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationBounce } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.bounce';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'bounce',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'bounce img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  axis?: string,
  bounces?: number,
  duration?: number,
  minimum?: number,
  style?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationBounce(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

// the result's frames change size, `mediaReply` adds the paste-the-link notice for it (from its metadata)
export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('bounce', chain.key, {
    axis: args.axis,
    bounces: args.bounces,
    duration: args.duration,
    minimum: args.minimum,
    style: args.style,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
