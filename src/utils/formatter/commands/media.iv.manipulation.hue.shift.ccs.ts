import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationHueShiftCCS } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.hue.shift.ccs';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'hueshiftccs 180',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'hueshiftccs img 180',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  gain?: number,
  gamma?: number,
  hue?: number,
  offset?: number,
  saturation?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationHueShiftCCS(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('hueshiftccs', chain.key, {hue: args.hue, saturation: args.saturation, gamma: args.gamma, gain: args.gain, offset: args.offset});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
