import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWiggle } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaWiggleDirections } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.wiggle';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'wiggle',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'wiggle img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_DIRECTION = MediaWiggleDirections.RIGHT;

export interface CommandArgs {
  amount?: number,
  direction?: string,
  loop?: boolean,
  speed?: number,
  url: string,
  wavelengths?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWiggle(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('wiggle', chain.key, {
    direction: args.direction,
    amount: args.amount,
    wavelengths: args.wavelengths,
    speed: args.speed,
    loop: args.loop,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
