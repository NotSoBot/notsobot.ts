import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationGrain } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.grain';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'grain',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'grain img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  flags?: string,
  strength?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationGrain(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the endpoint drops `flags` (always `at`), so they're left out here too
  return Mediascript.line('grain', chain.key, {strength: args.strength});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
