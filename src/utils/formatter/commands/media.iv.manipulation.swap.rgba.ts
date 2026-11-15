import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSwapRGBA } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.swap.rgba';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'swaprgba bgra',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'swaprgba img bgra',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  channels?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSwapRGBA(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the route needs channels, mediascript would leave the media as is without them
  if (!args.channels) {
    return null;
  }
  return Mediascript.line('swaprgba', chain.key, {channels: args.channels});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
