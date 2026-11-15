import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCartoon } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaCartoonMethods } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.cartoon';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'cartoon',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'cartoon img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_METHOD = MediaCartoonMethods.COLOR_DODGE_BLUR;

export interface CommandArgs {
  amount?: number,
  brightness?: number,
  levels?: number,
  method?: string,
  pattern?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCartoon(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('cartoon', chain.key, {
    amount: args.amount,
    brightness: args.brightness,
    levels: args.levels,
    method: args.method,
    pattern: args.pattern,
    saturation: args.saturation,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
