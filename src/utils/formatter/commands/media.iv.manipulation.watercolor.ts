import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationWatercolor } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.watercolor';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'watercolor',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'watercolor img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  contrast?: number,
  edge?: number,
  mixing?: number,
  smoothing?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationWatercolor(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('watercolor', chain.key, {
    contrast: args.contrast,
    edge: args.edge,
    mixing: args.mixing,
    smoothing: args.smoothing,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
