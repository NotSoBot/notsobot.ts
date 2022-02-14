import { Command, Interaction } from 'detritus-client';

import { imageToolsBackgroundRemove } from '../../../api';
import { ImageBackgroundRemovalModels, ImageBackgroundRemovalModelsToText } from '../../../constants';
import { imageReply } from '../../../utils';


export const DEFAULT_MODEL = ImageBackgroundRemovalModels.U2NET;

export const SLASH_CHOICES_MODEL = Object.keys(ImageBackgroundRemovalModelsToText).map((value) => {
  let name = ImageBackgroundRemovalModelsToText[value as ImageBackgroundRemovalModels];
  if (value === DEFAULT_MODEL) {
    name = `${name} (Default)`;
  }
  return {name, value};
}).sort((x) => (x.value === DEFAULT_MODEL) ? -1 : 0);

export interface CommandArgs {
  model?: string,
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageToolsBackgroundRemove(context, args);
  return imageReply(context, response);
}
