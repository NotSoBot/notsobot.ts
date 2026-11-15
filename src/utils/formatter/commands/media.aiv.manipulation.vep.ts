import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVManipulationVep } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.vep';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 640x360 like the clip
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vep',
  inputs: ['video', 'twirl'],
  script: [
    'load FILE_1 clip',
    'loadvep FILE_2 twirl',
    'veprender clip twirl',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
  // the .vep project's url, every one of its media becomes `url`
  vep: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {payload?: Parameters.FilePayload}): CommandArgs {
  const { file: vep, url } = args.payload || {};
  return {url: url || '', vep: vep || ''};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAIVManipulationVep(context, {
    // a pipe's later steps get the media as `file`
    file: args.file,
    safe: DefaultParameters.safe(context),
    url: args.url,
    vepUrl: args.vep,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.vep) {
    return null;
  }
  return Mediascript.line('veprender', chain.key, chain.loadFile('loadvep', args.vep));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
