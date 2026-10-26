import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioNormalize } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.normalize';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio normalize',
  inputs: ['quiet'],
  script: [
    'load FILE_1 audio',
    'audionormalize audio',
    'render audio',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  strength?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioNormalize(context, {
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
