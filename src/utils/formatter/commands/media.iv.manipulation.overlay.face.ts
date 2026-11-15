import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayFace } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.overlay.face';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'overlay face',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'overlayface img other',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  scale?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayFace(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (args.urls.length < 2) {
    return null;
  }
  // the route takes 0.01 to 1000, mediascript only 0.1 to 10
  if (args.scale !== undefined && args.scale !== null && (args.scale < 0.1 || 10 < args.scale)) {
    return null;
  }
  const face = chain.load(args.urls[1]);
  return Mediascript.line('overlayface', chain.key, {face_media: face, face_scale: args.scale});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
