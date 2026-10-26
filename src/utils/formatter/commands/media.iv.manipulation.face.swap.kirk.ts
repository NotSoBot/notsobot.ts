import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceSwapKirk } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.swap.kirk';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'kirkify',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'faceswappreset img kirk',
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
  return mediaIVManipulationFaceSwapKirk(context, {
    maxFaces: faces,
    safe: DefaultParameters.safe(context),
    ...rest,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
