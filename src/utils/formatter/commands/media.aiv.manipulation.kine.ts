import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVManipulationKine } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.kine';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 1280x720, the clip's 640x360 fills it
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'kine',
  inputs: ['video', 'preview2'],
  script: [
    'load FILE_1 clip',
    'loadkine FILE_2 p2',
    'kinerender clip p2',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  // the .kine project's url, every one of its media becomes `url`
  kine: string,
  url: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {payload?: Parameters.FilePayload}): CommandArgs {
  const { file: kine, url } = args.payload || {};
  return {kine: kine || '', url: url || ''};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAIVManipulationKine(context, {
    // a pipe's later steps get the media as `file`
    file: args.file,
    kineUrl: args.kine,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.kine) {
    return null;
  }
  return Mediascript.line('kinerender', chain.key, chain.loadFile('loadkine', args.kine));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
