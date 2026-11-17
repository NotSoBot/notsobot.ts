import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationTrim } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.trim';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'trim',
  inputs: ['bordered'],
  script: [
    'load FILE_1 img',
    'trim img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  margin?: number,
  threshold?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationTrim(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript's `trim` has no MARGIN (always 16), the pipe runs a job per step for it
  if (Mediascript.hasAny(args, 'margin')) {
    return null;
  }
  return Mediascript.line('trim', chain.key, {threshold: args.threshold});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
