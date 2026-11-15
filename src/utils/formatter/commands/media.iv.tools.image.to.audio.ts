import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsImageToAudio } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaImageToAudioModes, MediaImageToAudioScales } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.image.to.audio';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'imagetoaudio',
  inputs: ['photo'],
  script: [
    'load FILE_1 img',
    'imagetoaudio img',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  duration?: number,
  high?: number,
  invert?: boolean,
  low?: number,
  mode?: MediaImageToAudioModes,
  scale?: MediaImageToAudioScales,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsImageToAudio(context, {
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
