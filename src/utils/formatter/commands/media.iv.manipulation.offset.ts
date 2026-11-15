import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationOffset } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.tools.offset';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'offset 128 128',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'offset img 128 128',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  background?: string,
  x?: string,
  y?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationOffset(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  // the route works `x`/`y` out as expressions with the media's size (`mw/2`), mediascript has no `mw`/`mh`
  const position = (value?: string) => {
    if (value === undefined) {
      return undefined;
    }
    return (/^-?\d+$/.test(value.trim())) ? parseInt(value) : null;
  };
  const x = position(args.x);
  const y = position(args.y);
  if (x === null || y === null) {
    return null;
  }
  return Mediascript.line('offset', chain.key, {x, y, background: args.background});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
