import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaAVManipulationAudioSentenceMix } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.sentencemix';
export const IS_PIPEABLE = true;

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
  // every word fit to a beat at this tempo
  bpm?: number,
  // milliseconds of silence between the pieces
  gap?: number,
  sentence: string,
  skipmissing?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaAVManipulationAudioSentenceMix(context, {
    bpm: args.bpm,
    // a pipe's later steps get the media as `file`
    file: args.file,
    gap: args.gap,
    safe: DefaultParameters.safe(context),
    sentence: args.sentence,
    skipMissing: args.skipmissing,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (!args.sentence?.trim()) {
    return null;
  }
  return Mediascript.line('audiosentencemix', chain.key, {
    skip_missing: args.skipmissing,
    gap: args.gap,
    bpm: args.bpm,
    sentence: args.sentence,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
