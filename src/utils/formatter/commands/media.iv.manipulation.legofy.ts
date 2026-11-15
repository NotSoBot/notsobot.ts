import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationLegofy } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaLegofyPalettes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';
import * as Mediascript from '../mediascript';


export const COMMAND_ID = 'media.iv.manipulation.legofy';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'legofy',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'legofy img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  dither?: boolean,
  palette?: MediaLegofyPalettes,
  size?: number,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationLegofy(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export function createMediascript(args: CommandArgs, chain: Mediascript.MediascriptChain) {
  return Mediascript.line('legofy', chain.key, {size: args.size, palette: args.palette, dither: args.dither});
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
