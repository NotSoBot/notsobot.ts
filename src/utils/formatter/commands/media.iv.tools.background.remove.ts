import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsBackgroundRemove } from '../../../api';
import { MediaBackgroundRemovalModels, MediaBackgroundRemovalModelsToText } from '../../../constants';
import { DefaultParameters, jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.tools.background.remove';
export const IS_PIPEABLE = true;

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
  return mediaIVToolsBackgroundRemove(context, {
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
