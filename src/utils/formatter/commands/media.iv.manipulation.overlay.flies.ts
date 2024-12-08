import { Command, Interaction } from 'detritus-client';
import { RequestFile } from 'detritus-rest';

import { mediaIVManipulationOverlayFlies } from '../../../api';
import { mediaReply } from '../..';


export const COMMAND_ID = 'media.iv.manipulation.overlay.flies';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  amount?: number,
  flyImage?: string,
  speed?: number,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs & {file?: RequestFile},
) {
  return mediaIVManipulationOverlayFlies(context, {
    amount: args.amount,
    file: args.file,
    flyImage: args.flyImage,
    speed: args.speed,
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
