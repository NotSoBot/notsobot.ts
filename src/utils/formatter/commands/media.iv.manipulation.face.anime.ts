import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceAnime } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaFaceAnimeEyes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.anime';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'anime',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'faceanime img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_EYES = MediaFaceAnimeEyes.NORMAL;

export interface CommandArgs {
  eyes?: string,
  face?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceAnime(context, {
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
