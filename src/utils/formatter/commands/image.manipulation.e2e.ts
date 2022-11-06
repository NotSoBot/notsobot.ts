import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { imageManipulationPix2Pix } from '../../../api';
import { ImagePix2PixModels } from '../../../constants';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.manipulation.e2e';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return imageManipulationPix2Pix(context, {
    file: args.file,
    model: ImagePix2PixModels.EMOJI,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
