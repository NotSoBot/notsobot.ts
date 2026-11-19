import { Command, Interaction } from 'detritus-client';

import { mediaAIVManipulationAudioNoise } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaNoiseColors } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.aiv.manipulation.audio.noise';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio noise -color pink -amplitude 0.3',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'audionoise audio pink 0.3',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  amplitude?: number,
  color?: MediaNoiseColors,
  samplerate?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAIVManipulationAudioNoise(context, {
    amplitude: args.amplitude,
    color: args.color,
    safe: DefaultParameters.safe(context),
    sampleRate: args.samplerate,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('audionoise', chain.key, {
    color: (args.color) ? args.color.toLowerCase() : undefined,
    amplitude: args.amplitude,
    sample_rate: args.samplerate,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
