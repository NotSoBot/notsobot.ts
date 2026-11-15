import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEyes } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaEyeTypes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.eyes.pink';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'eyes pink',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'eyes img FLARE_PINK',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  flipped?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEyes(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    type: MediaEyeTypes.FLARE_PINK,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('eyes', chain.key, {type: MediaEyeTypes.FLARE_PINK, flipped: args.flipped});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
