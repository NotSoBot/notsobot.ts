import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOverlayRTX } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.overlay.rtx';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'overlay rtx',
  inputs: ['b1', 'face'],
  script: [
    'load FILE_1 img',
    'load FILE_2 other',
    'rtx img other',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  urls: Array<string>,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOverlayRTX(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  if (args.urls.length < 2) {
    return null;
  }
  return Mediascript.line('rtx', chain.key, chain.load(args.urls[1]));
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
