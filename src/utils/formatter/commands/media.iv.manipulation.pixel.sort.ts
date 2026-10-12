import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPixelSort } from '../../../api';
import { MediaPixelSortFunctions, MediaPixelSortIntervals } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.pixel.sort';
export const IS_PIPEABLE = true;

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
