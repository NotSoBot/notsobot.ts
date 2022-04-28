import { Command, Interaction } from 'detritus-client';

import { imageManipulationGrayscale } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.grayscale';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationGrayscale(context, args);
  return imageReply(context, response);
}
