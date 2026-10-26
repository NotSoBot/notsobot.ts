import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftHSVFFMPEG } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.hsv.ffmpeg';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'huehsvffmpeg',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'hueshifthsvffmpeg img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  brightness?: number,
  hue?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftHSVFFMPEG(context, {
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
