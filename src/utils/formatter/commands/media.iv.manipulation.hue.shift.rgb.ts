import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftRGB } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'huergb 120',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'hueshiftrgb img 120',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  blue?: number,
  green?: number,
  red?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftRGB(context, {
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
