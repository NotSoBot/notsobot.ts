import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationInterpolate } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.tools.interpolate';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'interpolate',
  inputs: ['video', 'video2'],
  script: [
    'load FILE_1 clip',
    'load FILE_2 other',
    'interpolate clip other',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  noloop?: boolean,
  segment?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationInterpolate(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // urls[0] is the piped media, urls[1] the other one
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  return Mediascript.line('interpolate', chain.key, chain.load(args.urls[1]), {segment: args.segment, loop: !args.noloop});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
