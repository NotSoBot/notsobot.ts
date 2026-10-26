import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationInstantCamera } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.instant.camera';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'instantcamera',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'instantcamera img',
    'render img image/webp',
  ].join('\n'),
};

export const MAX_CAPTION_LENGTH = 40;

export interface CommandArgs {
  text?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationInstantCamera(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
