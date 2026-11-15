import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceCutout } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.face.cutout';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'eyes cutout',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 cover',
    'facecutout img cover',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  color?: string,
  face?: number,
  size?: number,
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  // the second media (if any) covers the face, the features go over it
  return mediaIVManipulationFaceCutout(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the route takes one or two medias (the second covers the face), more gets its error from the job-per-step pipe
  if (!args.urls || 2 < args.urls.length) {
    return null;
  }
  const cover = (args.urls.length === 2) ? chain.load(args.urls[1]) : undefined;
  return Mediascript.line('facecutout', chain.key, {cover, color: args.color, size: args.size, face: args.face});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
