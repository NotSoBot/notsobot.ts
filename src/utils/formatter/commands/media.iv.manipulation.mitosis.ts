import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationMitosis } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.mitosis';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'mitosis',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'mitosis img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  direction?: string,
  duration?: number,
  style?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationMitosis(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('mitosis', chain.key, {direction: args.direction, style: args.style, duration: args.duration});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
