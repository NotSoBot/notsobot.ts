import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMandalaScope } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.mandalascope';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'mandalascope',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'mandalascope img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  rotation?: number,
  scale?: number,
  translation?: number,
  url: string,
  zoom?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMandalaScope(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('mandalascope', chain.key, {amount: args.amount, scale: args.scale, rotation: args.rotation, translation: args.translation, zoom: args.zoom});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
