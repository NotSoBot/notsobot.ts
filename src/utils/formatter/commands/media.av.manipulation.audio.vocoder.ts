import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVocoder } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.vocoder';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'vocoder',
  inputs: ['voice', 'music'],
  script: [
    'load FILE_1 voice',
    'load FILE_2 music',
    'vocoder voice music',
    'render voice',
  ].join('\n'),
};

export interface CommandArgs {
  bands?: number,
  // the voice first (it keeps its video), then the music it sings
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioVocoder(context, {
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
