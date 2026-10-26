import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationZoomBlur } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.zoom.blur';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'zoomblur',
  inputs: ['b1'],
  script: [
    'load FILE_1 img',
    'zoomblur img',
    'render img image/webp',
  ].join('\n'),
};

export interface CommandArgs {
  amount?: number,
  expand?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationZoomBlur(context, {
    safe: DefaultParameters.safe(context),
    ...args,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
