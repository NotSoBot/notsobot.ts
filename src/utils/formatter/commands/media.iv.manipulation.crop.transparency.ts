import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCropTransparency } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.crop.transparency';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'crop transparency',
  inputs: ['photo'],
  script: [
    'load FILE_1 img',
    'text shape NotSoBot SIZE=220 FONT=impact',
    'croptransparency img shape',
    'render img image/png',
  ].join('\n'),
};

export interface CommandArgs {
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // the first media cut to the second one's shape (its transparency)
  return mediaIVManipulationCropTransparency(context, {
    safe: DefaultParameters.safe(context),
    urls: args.urls,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the route takes exactly two medias, anything else gets its error from the job-per-step pipe
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  const mask = chain.load(args.urls[1]);
  return Mediascript.line('croptransparency', chain.key, mask);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
