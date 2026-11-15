import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioDistortion } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.distortion';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio distortion',
  inputs: ['music'],
  script: [
    'load FILE_1 audio',
    'audiodistortion audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  drive?: number,
  lowpass?: number,
  mix?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioDistortion(context, {
    safe: DefaultParameters.safe(context),
    drive: args.drive,
    mix: args.mix,
    lowPass: args.lowpass,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('audiodistortion', chain.key, {drive: args.drive, mix: args.mix, low_pass: args.lowpass});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
