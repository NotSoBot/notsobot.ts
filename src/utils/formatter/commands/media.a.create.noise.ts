import { Command, Interaction } from 'detritus-client';

import { mediaACreateNoise } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaNoiseColors } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.a.create.noise';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'noise 5 -color brown',
  inputs: [],
  script: [
    'createaudionoise audio 5 brown',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  amplitude?: number,
  color?: MediaNoiseColors,
  duration?: number,
  samplerate?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaACreateNoise(context, {
    amplitude: args.amplitude,
    color: args.color,
    duration: args.duration,
    safe: DefaultParameters.safe(context),
    sampleRate: args.samplerate,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
