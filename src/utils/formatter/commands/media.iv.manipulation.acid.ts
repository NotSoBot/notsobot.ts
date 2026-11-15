import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationAcid } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.acid';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'acid',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'acid img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  levels?: number,
  seed?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationAcid(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('acid', chain.key, {amount: args.amount, levels: args.levels, seed: args.seed});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
