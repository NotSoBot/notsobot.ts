import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWobble } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wobble';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'wobble',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'wobble img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  duration?: number,
  url: string,
  wobbles?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWobble(context, {
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
