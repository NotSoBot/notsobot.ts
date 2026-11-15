import { Command, Interaction } from 'detritus-client';

import { mediaAVManipulationAudioVibrato } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.manipulation.audio.vibrato';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audio vibrato',
  inputs: ['music'],
  script: [
    'load FILE_1 audio',
    'audiovibrato audio',
    'render audio',
  ].join('\n'),
};

export interface CommandArgs {
  blend?: boolean,
  depth?: number,
  frequency?: number,
  points?: string,
  semitones?: number,
  url: string,
}

// `-points "0,0 1,1"` keeps its quotes from the prefixed args
function cleanPoints(points?: string): string | undefined {
  const text = (points || '').trim().replace(/^["'`]+|["'`]+$/g, '').trim();
  return text || undefined;
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVManipulationAudioVibrato(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    blend: args.blend || undefined,
    points: cleanPoints(args.points),
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('audiovibrato', chain.key, {
    frequency: args.frequency,
    depth: args.depth,
    semitones: args.semitones,
    points: cleanPoints(args.points),
    blend: args.blend || undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
