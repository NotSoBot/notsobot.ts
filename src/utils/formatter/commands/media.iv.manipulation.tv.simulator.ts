import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationTVSimulator } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.tv.simulator';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'tvsimulator',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'tvsimulator img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  detailZoom?: number,
  lineSync?: number,
  url: string,
  vertical?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationTVSimulator(context, {
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
