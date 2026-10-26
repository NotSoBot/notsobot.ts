import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationOverlay } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.aiv.tools.overlay';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'overlay -opacity 50',
  inputs: ['face', 'b1'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'overlay img other 0 0 none 0.1 0 true 50',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  blend?: number,
  color?: string,
  noloop?: boolean,
  opacity?: number,
  resize?: string,
  similarity?: number,
  urls: Array<string>,
  x?: string,
  y?: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationOverlay(context, {
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
