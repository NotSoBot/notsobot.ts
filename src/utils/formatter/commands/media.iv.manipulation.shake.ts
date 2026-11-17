import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationShake } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.shake';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'shake',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'shake img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  horizontal?: number,
  randomize?: boolean,
  url: string,
  vertical?: number,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationShake(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('shake', chain.key, {horizontal: args.horizontal, vertical: args.vertical, randomize: args.randomize});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
