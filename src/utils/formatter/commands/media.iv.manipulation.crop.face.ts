import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCropFace } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop.face';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'crop face',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'cropface img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  face?: number,
  url: string,
  zoom?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCropFace(context, {
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
