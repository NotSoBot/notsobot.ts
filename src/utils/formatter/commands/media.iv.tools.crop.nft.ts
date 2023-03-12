import { Command, Interaction } from 'detritus-client';

import { imageToolsCropTwitterHex } from '../../../api';
import { imageReply } from '../..';


export const COMMAND_ID = 'image.tools.crop.nft';
export const IS_PIPEABLE = true;

export interface CommandArgs {
  background?: boolean,
  url: string,
}

export function createResponse(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  return imageToolsCropTwitterHex(context, args);
}

export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const response = await createResponse(context, args);
  return imageReply(context, response);
}
