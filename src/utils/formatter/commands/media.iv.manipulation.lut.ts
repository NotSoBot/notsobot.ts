import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationLUT } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.lut';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'lut',
  inputs: ['video', 'grade'],
  script: [
    'load FILE_1 clip',
    'loadcube FILE_2 grade',
    'applylut clip grade',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  // the .cube's url
  cube: string,
  interpolation?: string,
  strength?: number,
  url: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {interpolation?: string, payload?: Parameters.FilePayload, strength?: number}): CommandArgs {
  const { file: cube, url } = args.payload || {};
  return {cube: cube || '', interpolation: args.interpolation, strength: args.strength, url: url || ''};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationLUT(context, {
    cubeUrl: args.cube,
    // a pipe's later steps get the media as `file`
    file: args.file,
    interpolation: args.interpolation,
    safe: DefaultParameters.safe(context),
    strength: args.strength,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.cube) {
    return null;
  }
  const cube = chain.loadFile('loadcube', args.cube);
  return Mediascript.line('applylut', chain.key, cube, {strength: args.strength, interp: args.interpolation});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
