import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationPinchPunch } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


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

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('pinchpunch', chain.key, {intensity: args.intensity, x: args.x, y: args.y, x_scale: args.xScale, y_scale: args.yScale});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
