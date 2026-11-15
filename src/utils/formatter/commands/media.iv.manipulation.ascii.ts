import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationAscii } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.ascii';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'ascii',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'ascii img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  invert?: boolean,
  url: string,
  zoom?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationAscii(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('ascii', chain.key, {invert: args.invert, zoom: args.zoom});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
