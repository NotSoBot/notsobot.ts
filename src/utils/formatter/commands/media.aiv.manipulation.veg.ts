import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAIVManipulationVeg } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.veg';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
// the project is 1280x720, scaled back to the clip's size
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'veg',
  inputs: ['video', 'preview1280'],
  script: [
    'load FILE_1 clip',
    'loadveg FILE_2 p1280',
    'vegrender clip p1280',
    'resize clip 640 360',
    'render clip',
  ].join('\n'),
};

// the medias after the first that can share the project's sources (the api's `MAX_MEDIASCRIPT_VEG_MEDIAS` - 1)
export const MAX_EXTRA_MEDIAS = 3;

export interface CommandArgs {
  // more medias for the project's other sources: its first source (as they first play) becomes `url`, the second
  // `also[0]` and so on, round again when there are more sources than medias
  also?: Array<string>,
  cutoff?: boolean,
  url: string,
  // the .veg project's url, every one of its sources becomes `url` (or one of `also`)
  veg: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {also?: Array<string>, nocutoff?: boolean, payload?: Parameters.FilePayload}): CommandArgs {
  const { file: veg, url } = args.payload || {};
  return {also: args.also, cutoff: !args.nocutoff, url: url || '', veg: veg || ''};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAIVManipulationVeg(context, {
    cutoff: args.cutoff,
    extraUrls: (args.also || []).slice(0, MAX_EXTRA_MEDIAS),
    // a pipe's later steps get the media as `file`
    file: args.file,
    safe: DefaultParameters.safe(context),
    url: args.url,
    vegUrl: args.veg,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.veg) {
    return null;
  }
  const veg = chain.loadFile('loadveg', args.veg);
  const also = (args.also || []).slice(0, MAX_EXTRA_MEDIAS).map((url) => chain.load(url));
  return Mediascript.line('vegrender', chain.key, veg, {cutoff: args.cutoff}, ...also);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
