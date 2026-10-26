import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationCrop } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.crop';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'crop 260 260 120 20',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'crop img 260 260 120 20',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  height: string,
  width: string,
  x?: string,
  y?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationCrop(context, {
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
