import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEdgeDetect } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.edge.detect';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'edgedetect',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'edgedetect img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  invert?: boolean,
  method?: string,
  mix?: number,
  strength?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEdgeDetect(context, {
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
