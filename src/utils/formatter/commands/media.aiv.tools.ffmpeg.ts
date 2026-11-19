import { Command, Interaction } from 'detritus-client';

import { mediaAIVToolsFFMPEG } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.tools.ffmpeg';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'ffmpeg -vf negate -af "volume=2"',
  inputs: ['video'],
  script: [
    'load FILE_1 video',
    'ffmpeg video -vf negate -af "volume=2"',
    'render video',
  ].join('\n'),
};

export interface CommandArgs {
  options: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVToolsFFMPEG(context, {
    options: args.options,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the options are mediascript's own `ffmpeg` arguments, on one line (a zero width space splits lines too)
  const options = (args.options || '').replace(/[\s\u200b]+/g, ' ').trim();
  if (!options) {
    return null;
  }
  return `${Mediascript.line('ffmpeg', chain.key)} ${options}`;
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
