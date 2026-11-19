import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationBrightness } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.darken';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'darken 40',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'darken img 40',
    'render img image/webp',
  ].join('\n'),
};

// the brightness route with the amount taken off, like mediascript's `darken` (a negative amount darkens too)
const DEFAULT_PERCENTAGE = 25;

export interface CommandArgs {
  percentage?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const percentage = (args.percentage === undefined) ? DEFAULT_PERCENTAGE : args.percentage;
  return mediaIVManipulationBrightness(context, {
    percentage: -Math.abs(percentage),
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('darken', chain.key, {percentage: args.percentage});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
