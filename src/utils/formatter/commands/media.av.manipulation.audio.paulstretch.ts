import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioPaulstretch } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.paulstretch';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio paulstretch',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'audiopaulstretch audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  resolution?: number,
  stretch?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioPaulstretch(context, {
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
