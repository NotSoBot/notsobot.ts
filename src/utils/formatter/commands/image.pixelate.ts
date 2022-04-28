import { Command, Interaction } from 'detritus-client';

import { imageManipulationPixelate } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.pixelate';

export interface CommandArgs {
  url: string,
  width: number,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationPixelate(context, {
    pixelWidth: args.width,
    url: args.url,
  });
  return imageReply(context, response);
}
