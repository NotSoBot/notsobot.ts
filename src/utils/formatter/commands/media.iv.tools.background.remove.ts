import { Command, Interaction } from 'detritus-client';

import { imageToolsBackgroundRemove } from '../../../api';
import { ImageBackgroundRemovalModels, ImageBackgroundRemovalModelsToText } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.background.remove';
export const IS_PIPEABLE = true;

export const DEFAULT_MODEL = ImageBackgroundRemovalModels.ISNET_GENERAL_USE;

export const SLASH_CHOICES_MODEL = Object.keys(ImageBackgroundRemovalModelsToText).map((value) => {
  let name = ImageBackgroundRemovalModelsToText[value as ImageBackgroundRemovalModels];
  if (value === DEFAULT_MODEL) {
    name = `${name} (Default)`;
  }
  return {name, value};
}).sort((x) => (x.value === DEFAULT_MODEL) ? -1 : 0);


export interface CommandArgs {
  model?: string,
  trim?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageToolsBackgroundRemove(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
