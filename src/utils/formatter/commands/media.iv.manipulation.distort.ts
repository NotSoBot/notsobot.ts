import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationDistort } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.distort';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'distort arc 360',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'distort img arc 360',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  arguments?: Array<number>,
  method: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationDistort(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // mediascript reads at most 32 numbers
  const numbers = args.arguments || [];
  if (32 < numbers.length || !numbers.every((x) => Number.isFinite(x))) {
    return null;
  }
  return Mediascript.line('distort', chain.key, {method: args.method}, ...numbers.map((x) => Mediascript.encodeValue(x)));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
