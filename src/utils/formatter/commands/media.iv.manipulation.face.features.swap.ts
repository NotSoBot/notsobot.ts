import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceFeaturesSwap } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.features.swap';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'mimic',
  inputs: ['face', 'face2'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'facefeaturesswap img other',
    'render img image/webp',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  mode?: string,
  multiplier?: number,
  regions?: string,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceFeaturesSwap(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
