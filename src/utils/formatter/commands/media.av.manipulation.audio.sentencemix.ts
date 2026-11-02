import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioSentenceMix } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.av.manipulation.audio.sentencemix';

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'sentencemix',
  inputs: ['voice'],
  script: [
    'load FILE_1 audio',
    'audiosentencemix audio try this on your bad voice',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  // milliseconds of silence between the pieces
  gap?: number,
  sentence: string,
  skipmissing?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioSentenceMix(context, {
    gap: args.gap,
    safe: DefaultParameters.safe(context),
    sentence: args.sentence,
    skipMissing: args.skipmissing,
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
