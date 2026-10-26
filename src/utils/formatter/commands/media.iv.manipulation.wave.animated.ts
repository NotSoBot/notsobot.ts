import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWaveAnimated } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.wave.animated';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'waves',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'waves img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amplitude?: number,
  speed?: number,
  url: string,
  waveLength?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWaveAnimated(context, {
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
