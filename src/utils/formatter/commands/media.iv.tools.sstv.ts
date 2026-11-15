import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsSSTV } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaSSTVModes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.sstv';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`), Robot 36 is the shortest mode
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'sstv -mode robot36',
  inputs: ['photo'],
  script: [
    'load FILE_1 img',
    'sstv img robot36',
    'render img',
  ].join('\n'),
};

export interface CommandArgs {
  mode?: MediaSSTVModes,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsSSTV(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('sstv', chain.key, {mode: args.mode});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
