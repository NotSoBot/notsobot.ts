import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationRotate3d } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.rotate.3d';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'rotate3d 30 40 0',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'rotate3d img 30 40 0',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  crop?: string,
  order?: string,
  pan?: number,
  roll?: number,
  tilt?: number,
  url: string,
  zoom?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationRotate3d(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('rotate3d', chain.key, {
    pan: args.pan,
    tilt: args.tilt,
    roll: args.roll,
    zoom: args.zoom,
    crop: args.crop,
    order: args.order,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
