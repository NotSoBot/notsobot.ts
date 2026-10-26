import { Command, Interaction } from 'detritus-client';

import { mediaIVManipulationBackgroundRemove } from '../../../api';
import type { RestOptions } from '../../../api/types';
import { MediaBackgroundRemovalModels, MediaBackgroundRemovalModelsToText } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.background.remove';
export const IS_PIPEABLE = true;

// the commands page's before/after preview (see `owner.upload.commands`)
export const PREVIEW: RestOptions.CommandPreview = {
  example: 'background remove',
  inputs: ['photo'],
  script: [
    'load FILE_1 img',
    'backgroundremove img',
    'render img image/webp',
  ].join('\n'),
};

export const DEFAULT_MODEL = MediaBackgroundRemovalModels.ISNET_GENERAL_USE;


export interface CommandArgs {
  model?: string,
  trim?: boolean,
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVManipulationBackgroundRemove(context, {
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
