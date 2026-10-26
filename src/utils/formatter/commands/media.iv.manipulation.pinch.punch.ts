import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPinchPunch } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.pinch.punch';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'pinchpunch',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'pinchpunch img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  intensity?: number,
  url: string,
  x?: number,
  xScale?: number,
  y?: number,
  yScale?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationPinchPunch(context, {
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
