import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceSwapBuscemi } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.face.swap.buscemi';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'buscemi',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'faceswappreset img buscemi',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  faces?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const { faces, ...rest } = args;
  return mediaIVManipulationFaceSwapBuscemi(context, {
    maxFaces: faces,
    safe: DefaultParameters.safe(context),
    ...rest,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('faceswappreset', chain.key, {name: 'buscemi', max_faces: args.faces});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
