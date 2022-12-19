import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { imageManipulationPixelate } from '../../../api';
import { imageReply } from '../../../utils';


export const COMMAND_ID = 'image.pixelate';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  url: string,
  width: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return imageManipulationPixelate(context, {
    file: args.file,
    pixelWidth: args.width,
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
