import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSkew } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.skew';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'skew 30',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'skew img 30',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  url: string,
  vertical?: boolean,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSkew(context, {
    amount: args.amount,
    safe: DefaultParameters.safe(context),
    url: args.url,
    vertical: args.vertical,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('skew', chain.key, {amount: args.amount, vertical: args.vertical || undefined});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
