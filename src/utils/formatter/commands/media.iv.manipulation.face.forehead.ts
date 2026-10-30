import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationFaceForehead } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaFaceForeheadSizes } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.i.manipulation.face.forehead';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'forehead',
  inputs: ['face'],
  script: [
    'load FILE_1 img',
    'faceforehead img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_SIZE = MediaFaceForeheadSizes.FIVEHEAD;

export interface CommandArgs {
  face?: number,
  size?: string,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationFaceForehead(context, {
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
