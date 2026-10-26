import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationPix2Pix } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaPix2PixModels } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.edges2flesh';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'edges2flesh',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'pix2pix img flesh',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationPix2Pix(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    model: MediaPix2PixModels.FLESH,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
