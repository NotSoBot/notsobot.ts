import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceMountRushmore } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.mount.rushmore';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'rushmore',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'facemountrushmore img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  face?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceMountRushmore(context, {
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
