import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationSetFrameDelay } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.set.framedelay';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'setframedelay 200',
  inputs: ['video'],
  script: [
    'load FILE_1 img',
    'setframedelay img 200',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  delay: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationSetFrameDelay(context, {
    delay: args.delay,
    safe: DefaultParameters.safe(context),
    url: args.url,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('setframedelay', chain.key, {delay: args.delay});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
