import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationXyt } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, Parameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.xyt';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'xyt',
  inputs: ['video', 'funface'],
  script: [
    'load FILE_1 clip',
    'loadxyt FILE_2 funface',
    'xytrender clip funface',
    'render clip',
  ].join('\n'),
};

export interface CommandArgs {
  // a text bubble template's words
  text?: string,
  url: string,
  // the VivaVideo template's url, or `xytId` for one of the api's built-in templates (id or name)
  xyt?: string,
  xytId?: string,
}

// the prefixed command's parsed args for a pipe step (its `run`, which isn't called there, does this)
export function fromCommandArgs(args: {payload?: Parameters.FilePayload, text?: string}): CommandArgs {
  const { file: xyt, name: xytId, url } = args.payload || {};
  return {text: args.text || undefined, url: url || '', ...((xyt) ? {xyt} : {xytId: xytId || undefined})};
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationXyt(context, {
    // a pipe's later steps get the media as `file`
    file: args.file,
    safe: DefaultParameters.safe(context),
    text: args.text,
    url: args.url,
    xytId: args.xytId,
    xytUrl: args.xyt,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript only loads a template's file, the api's own templates (`xytId`) and bubble text are the endpoint's
  if (!args.xyt || args.xytId || args.text) {
    return null;
  }
  return Mediascript.line('xytrender', chain.key, chain.loadFile('loadxyt', args.xyt));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
