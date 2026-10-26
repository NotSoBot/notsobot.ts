import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPixelSort } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaPixelSortFunctions, MediaPixelSortIntervals } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.pixel.sort';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'pixelsort -lower 0 -upper 1 -length 80',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'pixelsort img 0 THRESHOLD LIGHTNESS 0 1 80',
    'render img image/webp',
  ].join('\n'),
};

// the IMAGE interval with COLOR sorting is their pxl-srt
export const CREDITS = [{name: 'solst-ice', url: 'https://github.com/solst-ice/pxl-srt'}];

export interface CommandArgs {
  angle?: number,
  interval?: MediaPixelSortIntervals,
  length?: number,
  lower?: number,
  randomness?: number,
  reverse?: boolean,
  seed?: number,
  sort?: MediaPixelSortFunctions,
  upper?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { sort, ...rest } = args;
  return mediaIVManipulationPixelSort(context, {
    safe: DefaultParameters.safe(context),
    ...rest,
    sortBy: sort,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
