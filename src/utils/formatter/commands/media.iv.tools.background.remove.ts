import { Command, Interaction } from 'detritus-client';

import { mediaIVToolsBackgroundRemove } from '../../../api';
import { MediaBackgroundRemovalModels, MediaBackgroundRemovalModelsToText } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'media.iv.tools.background.remove';
export const IS_PIPEABLE = true;

export const DEFAULT_MODEL = MediaBackgroundRemovalModels.ISNET_GENERAL_USE;


export interface CommandArgs {
  model?: string,
  trim?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return mediaIVToolsBackgroundRemove(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
