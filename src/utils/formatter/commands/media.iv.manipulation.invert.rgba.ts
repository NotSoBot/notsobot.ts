import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationInvertRGBA } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.invert.rgba';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'invertrgba',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'invertrgba img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  alpha?: number,
  blue?: number,
  green?: number,
  red?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationInvertRGBA(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('invertrgba', chain.key, {red: args.red, green: args.green, blue: args.blue, alpha: args.alpha});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
