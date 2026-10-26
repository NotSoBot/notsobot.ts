import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioEqualizer } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.equalizer';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio equalizer -subbass 8 -bass 6',
  inputs: ['music'],
  script: [
    'load FILE_1 audio',
    'audioequalizer audio 8 6',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  air?: number,
  bass?: number,
  highMids?: number,
  lowMids?: number,
  mids?: number,
  subBass?: number,
  treble?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioEqualizer(context, {
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
