import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVManipulationWlmp } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.wlmp';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 16:9 (1280x720), scaled back to the clip's size
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'wlmp',
  inputs: ['video', 'movie'],
  script: [
    'load FILE_1 clip',
    'loadwlmp FILE_2 movie',
    'wlmprender clip movie',
    'resize clip 640 360',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
  // the .wlmp project's url, every one of its media becomes `url`
  wlmp: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {payload?: Parameters.FilePayload}): CommandArgs {
  const { file: wlmp, url } = args.payload || {};
  return {url: url || '', wlmp: wlmp || ''};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAIVManipulationWlmp(context, {
    // a pipe's later steps get the media as `file`
    file: args.file,
    safe: DefaultParameters.safe(context),
    url: args.url,
    wlmpUrl: args.wlmp,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.wlmp) {
    return null;
  }
  return Mediascript.line('wlmprender', chain.key, chain.loadFile('loadwlmp', args.wlmp));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
