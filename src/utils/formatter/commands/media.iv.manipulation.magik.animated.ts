import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMagikAnimated } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.magik.animated';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'magik gif',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'magikanimated img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  boomerang?: boolean,
  scale?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMagikAnimated(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('magikanimated', chain.key, {scale: args.scale, boomerang: args.boomerang});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
