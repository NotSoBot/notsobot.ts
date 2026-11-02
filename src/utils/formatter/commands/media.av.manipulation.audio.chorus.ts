import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioChorus } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.chorus';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio chorus',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'audiochorus audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  delay?: number,
  depth?: number,
  mix?: number,
  rate?: number,
  url: string,
  voices?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioChorus(context, {
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
