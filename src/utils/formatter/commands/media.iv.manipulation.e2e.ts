import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationPix2Pix } from '../../../api';
import { ImagePix2PixModels } from '../../../constants';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.e2e';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationPix2Pix(context, {
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
  return mediaReply(context, response);
}
