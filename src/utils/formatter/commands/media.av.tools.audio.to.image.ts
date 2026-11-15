import { Command, Interaction } from 'detritus-client';

import { mediaAVToolsAudioToImage } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaAudioToImageModes, MediaImageToAudioScales } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.av.tools.audio.to.image';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'audiotoimage',
  inputs: ['voice'],
  script: [
    'load FILE_1 img',
    'audiotoimage img',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  high?: number,
  invert?: boolean,
  low?: number,
  mode?: MediaAudioToImageModes,
  scale?: MediaImageToAudioScales,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaAVToolsAudioToImage(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('audiotoimage', chain.key, {
    mode: args.mode,
    low: args.low,
    high: args.high,
    scale: args.scale,
    invert: args.invert,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
