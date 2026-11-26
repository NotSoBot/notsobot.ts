import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceBigHead } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.face.big.head';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'bighead',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'facebighead img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_SIZE = 1.5;
export const MIN_SIZE = 1.1;
export const MAX_SIZE = 3;

export interface CommandArgs {
  size?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceBigHead(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('facebighead', chain.key, {size: args.size});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
