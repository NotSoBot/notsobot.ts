import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceXmasCap } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaFaceXmasCapColors } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.face.xmas.cap';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'xmascap',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'facexmascap img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_COLOR = MediaFaceXmasCapColors.RED;

export interface CommandArgs {
  color?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceXmasCap(context, {
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
