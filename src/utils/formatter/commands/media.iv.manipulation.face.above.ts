import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceAbove } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.face.above';
export const IS_PIPEABLE = true;

// the most heads `faces` can pick
export const MAX_FACES = 20;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'abovehead',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 above',
    'abovehead img above',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  faces?: Array<number>,
  size?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // the second media goes above every head in the first, or only the `faces` picked
  return mediaIVManipulationFaceAbove(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    faces: (args.faces && args.faces.length) ? args.faces : undefined,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the media and the image, anything else gets its error from the job-per-step pipe
  if (!args.urls || args.urls.length !== 2) {
    return null;
  }
  const image = chain.load(args.urls[1]);
  const faces = (args.faces && args.faces.length) ? args.faces.join(',') : undefined;
  return Mediascript.line('abovehead', chain.key, image, {faces, size: args.size});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
