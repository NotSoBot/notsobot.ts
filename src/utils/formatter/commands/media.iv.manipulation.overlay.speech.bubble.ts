import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlaySpeechBubble } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaSpeechBubbleDirections } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.overlay.speech.bubble';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'speechbubble',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'speechbubble img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_DIRECTION = MediaSpeechBubbleDirections.AUTO;

export interface CommandArgs {
  direction?: string,
  // the api's default is a cut out (transparent) bubble, `white` draws it white instead
  white?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlaySpeechBubble(context, {
    direction: args.direction,
    safe: DefaultParameters.safe(context),
    transparent: (args.white) ? false : undefined,
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('speechbubble', chain.key, {
    direction: args.direction,
    transparent: (args.white) ? false : undefined,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
