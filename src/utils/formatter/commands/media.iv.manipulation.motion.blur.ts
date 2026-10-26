import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMotionBlur } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.motion.blur';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'motionblur',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'motionblur img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  strength?: number,
  url: string,
  vertical?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMotionBlur(context, {
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
