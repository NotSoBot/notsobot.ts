import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationContrastMultiply } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.contrast.multiply';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'contrast multiply 2',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'contrastmultiply img 2',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  multiplier?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationContrastMultiply(context, {
    multiplier: args.multiplier,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('contrastmultiply', chain.key, {multiplier: args.multiplier});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
