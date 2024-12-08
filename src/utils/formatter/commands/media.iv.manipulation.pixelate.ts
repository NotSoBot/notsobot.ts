import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationPixelate } from '../../../api';
import { mediaReply } from '../../../utils';


export const COMMAND_ID = 'media.iv.manipulation.pixelate';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  noLines?: boolean,
  url: string,
  width?: number,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationPixelate(context, {
    file: args.file,
    noLines: args.noLines,
    pixelWidth: args.width,
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
