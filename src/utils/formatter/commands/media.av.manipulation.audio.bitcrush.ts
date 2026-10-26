import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioBitcrush } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaAudioBitcrushModes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.bitcrush';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio bitcrush',
  inputs: ['music'],
  script: [
    'load FILE_1 audio',
    'audiobitcrush audio',
    'render audio',
  ].join('\n'),
};

export const DEFAULT_MODE = MediaAudioBitcrushModes.LOG;

export interface CommandArgs {
  bits?: number,
  mix?: number,
  mode?: MediaAudioBitcrushModes,
  samples?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioBitcrush(context, {
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
