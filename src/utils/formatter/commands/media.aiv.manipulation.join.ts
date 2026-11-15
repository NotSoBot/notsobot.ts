import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationJoin } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.join';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'join',
  inputs: ['b1', 'face'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'join img other',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  noloop?: boolean,
  noresize?: boolean,
  urls: Array<string>,
  vertical?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationJoin(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // urls[0] is the piped media, urls[1] the other one
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  return Mediascript.line('join', chain.key, chain.load(args.urls[1]), {vertical: args.vertical, loop: !args.noloop, no_resize: args.noresize});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
