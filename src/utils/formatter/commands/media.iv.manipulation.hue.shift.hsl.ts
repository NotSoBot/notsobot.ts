import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftHSL } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.hsl';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'huehsl',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'hueshifthsl img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  hue?: number,
  lightness?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftHSL(context, {
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
