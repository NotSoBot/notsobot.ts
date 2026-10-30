import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceMonaLisa } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.mona.lisa';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'monalisa',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'facemonalisa img',
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
  return mediaIVManipulationFaceMonaLisa(context, {
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
