import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationSetBitRate } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.tools.set.bitrate';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'bitrate 60000 16000',
  inputs: ['video'],
  script: [
    'load FILE_1 clip',
    'bitrate clip 60000 16000',
    'render clip',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  audio?: number,
  url: string,
  video?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationSetBitRate(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('bitrate', chain.key, {video: args.video, audio: args.audio});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
