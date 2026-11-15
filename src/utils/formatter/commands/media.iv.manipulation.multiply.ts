import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMultiply } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.multiply';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'multiply',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'multiply img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  grid?: number,
  rotate?: boolean,
  seed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMultiply(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('multiply', chain.key, {grid: args.grid, rotate: args.rotate, seed: args.seed});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
