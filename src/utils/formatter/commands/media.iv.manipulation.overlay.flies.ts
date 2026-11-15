import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationOverlayFlies } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.overlay.flies';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'overlay flies -amount 5',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'overlayflies img 5',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  degrees?: number,
  flyImage?: string,
  speed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationOverlayFlies(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  const fly = (args.flyImage) ? chain.load(args.flyImage) : undefined;
  return Mediascript.line('flies', chain.key, {
    amount: args.amount,
    degrees: args.degrees,
    speed: args.speed,
    fly_media: fly,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
