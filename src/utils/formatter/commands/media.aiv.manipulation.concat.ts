import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationConcat } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.tools.concat';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'concat',
  inputs: ['voice', 'music'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'concat img other',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationConcat(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // urls[0] is the piped media, urls[1] the other one
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  return Mediascript.line('concat', chain.key, chain.load(args.urls[1]));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
