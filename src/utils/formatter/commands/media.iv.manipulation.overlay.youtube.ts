import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationOverlayYouTube } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.overlay.youtube';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'text youtube Kid Discovers Painting (GONE WRONG)',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'youtube img Kid Discovers Painting (GONE WRONG)',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  channel?: string,
  text: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationOverlayYouTube(context, {
    safe: DefaultParameters.safe(context),
    ...args,
    // the channel is whoever made it unless they named one
    channel: args.channel || context.user.globalName || context.user.username,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const job = await createJob(context, args);
  return jobReply(context, job);
}
