import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioFlanger } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.flanger';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio flanger',
  inputs: ['music'],
  script: [
    'load FILE_1 audio',
    'audioflanger audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  delay?: number,
  depth?: number,
  phase?: number,
  regen?: number,
  speed?: number,
  url: string,
  width?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioFlanger(context, {
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
