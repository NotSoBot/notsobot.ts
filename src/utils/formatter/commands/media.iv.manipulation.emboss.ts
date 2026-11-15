import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationEmboss } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.emboss';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'emboss',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'emboss img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  azimuth?: number,
  compose?: string,
  elevation?: number,
  depth?: number,
  intensity?: number,
  gray?: number,
  method?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationEmboss(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('emboss', chain.key, {
    azimuth: args.azimuth,
    compose: args.compose,
    depth: args.depth,
    elevation: args.elevation,
    gray: args.gray,
    intensity: args.intensity,
    method: args.method,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
