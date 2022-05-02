import { Command, Interaction } from 'detritus-client';

import { imageManipulationPix2Pix } from '../../../api';
import { ImagePix2PixModels } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.manipulation.e2e';

export interface CommandArgs {
  url: string,
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await imageManipulationPix2Pix(context, {
    model: ImagePix2PixModels.EMOJI,
    url: args.url,
  });
  return imageReply(context, response);
}
