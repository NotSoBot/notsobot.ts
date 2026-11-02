import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioPingPong } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.pingpong';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio pingpong',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'audiopingpong audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  keeplength?: boolean,
  length?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioPingPong(context, {
    keepLength: args.keeplength,
    length: args.length,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
