import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayWatermark } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.watermark';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'watermark',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 mark',
    'watermark img mark',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  margin?: number,
  opacity?: number,
  size?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayWatermark(context, {
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
