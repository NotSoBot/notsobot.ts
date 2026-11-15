import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioChannelsInvert } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.channels.invert';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio channels invert',
  inputs: ['stereo'],
  script: [
    'load FILE_1 audio',
    'audiochannelsinvert audio',
    'render audio',
  ].join('\n'),
};

export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioChannelsInvert(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('audiochannelsinvert', chain.key);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
