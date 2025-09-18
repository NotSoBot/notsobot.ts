import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationPix2Pix } from '../../../api';
import { MediaPix2PixModels } from '../../../constants';
import { jobReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.e2p';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
}

export function createJob(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationPix2Pix(context, {
    file: args.file,
    model: MediaPix2PixModels.PORN,
    url: args.url,
  });
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createJob(context, args);
  return jobReply(context, response);
}
